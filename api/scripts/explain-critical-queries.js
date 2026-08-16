import pool from "../src/config/database.js";

const fixtureResult = await pool.query(`
  SELECT
    c.id AS card_id,
    c.set_id,
    s.tcg_id,
    (SELECT id FROM users ORDER BY created_at ASC LIMIT 1) AS user_id
  FROM cards c
  INNER JOIN sets s ON s.id = c.set_id
  ORDER BY c.created_at ASC
  LIMIT 1
`);

const fixture = fixtureResult.rows[0];

if (!fixture) {
  throw new Error("No existe una card de referencia para ejecutar EXPLAIN");
}

const plans = [
  {
    name: "cards_by_set_sorted",
    query: `
      EXPLAIN (FORMAT JSON)
      SELECT c.id, c.name, c.card_number, c.rarity
      FROM cards c
      WHERE c.set_id = $1
      ORDER BY c.name ASC
      LIMIT 25
    `,
    values: [fixture.set_id],
  },
  {
    name: "card_prices_latest",
    query: `
      EXPLAIN (FORMAT JSON)
      SELECT id, card_id, condition, price, currency, source, recorded_at
      FROM card_prices
      WHERE card_id = $1
      ORDER BY recorded_at DESC
      LIMIT 1
    `,
    values: [fixture.card_id],
  },
  {
    name: "graded_prices_latest",
    query: `
      EXPLAIN (FORMAT JSON)
      SELECT id, card_id, grading_company_id, grade, price, recorded_at
      FROM graded_card_prices
      WHERE card_id = $1
      ORDER BY recorded_at DESC
      LIMIT 1
    `,
    values: [fixture.card_id],
  },
  {
    name: "collection_by_user_with_catalog_joins",
    query: `
      EXPLAIN (FORMAT JSON)
      SELECT ci.id, ci.quantity, ci.condition, c.name, s.name, t.name
      FROM collection_items ci
      INNER JOIN cards c ON c.id = ci.card_id
      INNER JOIN sets s ON s.id = c.set_id
      INNER JOIN tcgs t ON t.id = s.tcg_id
      WHERE ci.user_id = $1
      ORDER BY ci.created_at DESC
      LIMIT 25
    `,
    values: [fixture.user_id ?? "00000000-0000-4000-8000-000000000000"],
  },
];

try {
  const result = [];

  for (const plan of plans) {
    const explainResult = await pool.query(plan.query, plan.values);
    result.push({ name: plan.name, plan: explainResult.rows[0]["QUERY PLAN"] });
  }

  console.log(
    JSON.stringify(
      {
        fixture,
        plans: result,
      },
      null,
      2,
    ),
  );
} finally {
  await pool.end();
}
