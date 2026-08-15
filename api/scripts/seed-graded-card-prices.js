import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT,
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
});

const FIXTURE_SOURCE = "development-fixture";
const FIXTURE_GRADING_COMPANY_NAME = "Development Fixture Grading";
const FIXTURE_GRADE = 9;

try {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const cardResult = await client.query(`
      SELECT id
      FROM cards
      ORDER BY created_at ASC, id ASC
      LIMIT 1
    `);

    const card = cardResult.rows[0];

    if (!card) {
      throw new Error("Se necesita al menos una card para crear el fixture");
    }

    const gradingCompanyResult = await client.query(
      `
        SELECT id, name
        FROM grading_companies
        WHERE name = $1
        LIMIT 1
      `,
      [FIXTURE_GRADING_COMPANY_NAME],
    );

    let gradingCompany = gradingCompanyResult.rows[0];
    let gradingCompanyCreated = false;

    if (!gradingCompany) {
      const createdCompanyResult = await client.query(
        `
          INSERT INTO grading_companies (name)
          VALUES ($1)
          RETURNING id, name
        `,
        [FIXTURE_GRADING_COMPANY_NAME],
      );

      gradingCompany = createdCompanyResult.rows[0];
      gradingCompanyCreated = true;
    }

    const existingResult = await client.query(
      `
        SELECT id, recorded_at
        FROM graded_card_prices
        WHERE card_id = $1
          AND grading_company_id = $2
          AND grade = $3
          AND source = $4
        ORDER BY recorded_at ASC
      `,
      [card.id, gradingCompany.id, FIXTURE_GRADE, FIXTURE_SOURCE],
    );

    if (existingResult.rows.length === 0) {
      await client.query(
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
          VALUES
            ($1, $2, $3, $4, $5, $6, NOW() - INTERVAL '1 day'),
            ($1, $2, $3, $7, $5, $6, NOW())
        `,
        [
          card.id,
          gradingCompany.id,
          FIXTURE_GRADE,
          100,
          "USD",
          FIXTURE_SOURCE,
          125,
        ],
      );
    }

    await client.query("COMMIT");

    console.log(
      JSON.stringify(
        {
          source: FIXTURE_SOURCE,
          cardId: card.id,
          gradingCompanyId: gradingCompany.id,
          gradingCompanyName: gradingCompany.name,
          gradingCompanyCreated,
          grade: FIXTURE_GRADE,
          rowsCreated: existingResult.rows.length === 0 ? 2 : 0,
          rowsAlreadyPresent: existingResult.rows.length,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
} finally {
  await pool.end();
}
