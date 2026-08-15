import "dotenv/config";
import crypto from "node:crypto";
import pg from "pg";

import appPool from "../src/config/database.js";
import { getCollectionValue } from "../src/repositories/collection-items.repository.js";
import { collectionValueResponseSchema } from "../src/schemas/collection-items.schema.js";

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT,
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
});

let testUserId = null;
let client = null;

try {
  client = await pool.connect();
  await client.query("BEGIN");

  const fixturePriceResult = await client.query(`
    SELECT card_id, grading_company_id, grade, price
    FROM graded_card_prices
    WHERE source = 'development-fixture'
    ORDER BY recorded_at DESC
    LIMIT 1
  `);

  const fixturePrice = fixturePriceResult.rows[0];

  if (!fixturePrice) {
    throw new Error(
      "Primero ejecuta pnpm db:seed:graded para crear el precio fixture",
    );
  }

  const suffix = crypto.randomUUID();
  const userResult = await client.query(
    `
      INSERT INTO users (username, password, email, role)
      VALUES ($1, $2, $3, 'user')
      RETURNING id
    `,
    [`gv-${suffix}`, "test-only-password", `gv-${suffix}@t.local`],
  );

  testUserId = userResult.rows[0].id;

  await client.query(
    `
      INSERT INTO collection_items (
        user_id,
        card_id,
        quantity,
        condition,
        is_graded,
        grading_company_id,
        grade
      )
      VALUES ($1, $2, 2, 'Near Mint', true, $3, $4)
    `,
    [
      testUserId,
      fixturePrice.card_id,
      fixturePrice.grading_company_id,
      fixturePrice.grade,
    ],
  );

  await client.query("COMMIT");
  client.release();
  client = null;

  const value = await getCollectionValue(testUserId);
  collectionValueResponseSchema.parse({ data: value });

  const expectedValue = Number(fixturePrice.price) * 2;
  const gradingBreakdown = value.byGradingCompany[0];

  if (
    value.summary.gradedItemsEvaluatedCount !== 1 ||
    value.summary.gradedItemsMissingPriceCount !== 0 ||
    value.summary.totalEstimatedValue !== expectedValue ||
    !gradingBreakdown ||
    gradingBreakdown.estimatedValue !== expectedValue ||
    value.topValuedItems[0]?.isGraded !== true
  ) {
    throw new Error(`Valoración graded inesperada: ${JSON.stringify(value)}`);
  }

  console.log(
    JSON.stringify(
      {
        status: "ok",
        gradedItemsEvaluatedCount: value.summary.gradedItemsEvaluatedCount,
        totalEstimatedValue: value.summary.totalEstimatedValue,
        gradingCompanyEstimatedValue: gradingBreakdown.estimatedValue,
      },
      null,
      2,
    ),
  );
} catch (error) {
  if (client) {
    await client.query("ROLLBACK");
  }

  throw error;
} finally {
  if (client) {
    client.release();
  }

  if (testUserId) {
    await pool.query("DELETE FROM collection_items WHERE user_id = $1", [testUserId]);
    await pool.query("DELETE FROM users WHERE id = $1", [testUserId]);
  }

  await pool.end();
  await appPool.end();
}
