import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import pool, { closeDatabasePool } from "../src/config/database.js";

const psaPriceSchema = z.object({
  cardId: z.string().uuid(),
  grade: z.coerce.number().min(0).max(10),
  price: z.coerce.number().finite().min(0),
  currency: z.string().trim().min(1).max(10),
  source: z.string().trim().min(1).max(100),
  recordedAt: z.string().datetime({ offset: true }).optional(),
});

const psaImportSchema = z.object({
  prices: z.array(psaPriceSchema).min(1).max(1000),
});

function formatValidationError(error) {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "prices"}: ${issue.message}`)
    .join("\n");
}

async function readImportFile(filePath) {
  const absolutePath = path.resolve(process.cwd(), filePath);
  const content = await readFile(absolutePath, "utf8");
  let payload;

  try {
    payload = JSON.parse(content);
  } catch {
    throw new Error("El archivo PSA no contiene JSON válido");
  }

  const result = psaImportSchema.safeParse(payload);

  if (!result.success) {
    throw new Error(`El archivo PSA no cumple el contrato:\n${formatValidationError(result.error)}`);
  }

  const importTimestamp = new Date();

  return result.data.prices.map((price) => ({
    ...price,
    recordedAt: price.recordedAt ? new Date(price.recordedAt) : importTimestamp,
  }));
}

async function importPrices(prices, dryRun = false) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const companyResult = await client.query(
      `
        SELECT id
        FROM grading_companies
        WHERE name = $1
        LIMIT 1
      `,
      ["PSA"],
    );
    const psaCompany = companyResult.rows[0];

    if (!psaCompany) {
      throw new Error("PSA no está registrada. Ejecuta pnpm db:migrate primero");
    }

    const cardIds = [...new Set(prices.map((price) => price.cardId))];
    const cardsResult = await client.query(
      `
        SELECT id
        FROM cards
        WHERE id = ANY($1::uuid[])
      `,
      [cardIds],
    );
    const existingCardIds = new Set(cardsResult.rows.map((card) => card.id));
    const missingCardIds = cardIds.filter((cardId) => !existingCardIds.has(cardId));

    if (missingCardIds.length > 0) {
      throw new Error(`No existen ${missingCardIds.length} cards del archivo PSA`);
    }

    let created = 0;
    let duplicatesSkipped = 0;

    for (const price of prices) {
      const values = [
        price.cardId,
        psaCompany.id,
        price.grade,
        price.price,
        price.currency,
        price.source,
        price.recordedAt,
      ];
      const result = dryRun
        ? await client.query(
          `
            SELECT 1
            FROM graded_card_prices
            WHERE card_id = $1
              AND grading_company_id = $2
              AND grade = $3
              AND price = $4
              AND currency = $5
              AND source = $6
              AND recorded_at = $7
            LIMIT 1
          `,
          values,
        )
        : await client.query(
          `
            INSERT INTO graded_card_prices (
              card_id,
              grading_company_id,
              grade,
              price,
              currency,
              source,
              recorded_at
            )
            SELECT $1, $2, $3, $4, $5, $6, $7
            WHERE NOT EXISTS (
              SELECT 1
              FROM graded_card_prices
              WHERE card_id = $1
                AND grading_company_id = $2
                AND grade = $3
                AND price = $4
                AND currency = $5
                AND source = $6
                AND recorded_at = $7
            )
            RETURNING id
          `,
          values,
        );

      const isDuplicate = dryRun ? result.rowCount > 0 : result.rowCount === 0;

      if (isDuplicate) {
        duplicatesSkipped += 1;
      } else {
        created += 1;
      }
    }

    if (dryRun) {
      await client.query("ROLLBACK");

      return {
        gradingCompany: "PSA",
        dryRun: true,
        received: prices.length,
        wouldCreate: created,
        duplicatesSkipped,
      };
    }

    await client.query("COMMIT");

    return {
      gradingCompany: "PSA",
      dryRun: false,
      received: prices.length,
      created,
      duplicatesSkipped,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  const argumentsList = process.argv.slice(2);
  const dryRun = argumentsList.includes("--dry-run");
  const filePath = argumentsList.find((argument) => !argument.startsWith("--"));

  if (!filePath) {
    throw new Error("Uso: pnpm import:psa -- ruta/al/archivo.json");
  }

  const prices = await readImportFile(filePath);
  const summary = await importPrices(prices, dryRun);

  console.log(JSON.stringify(summary, null, 2));
}

try {
  await main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await closeDatabasePool();
}
