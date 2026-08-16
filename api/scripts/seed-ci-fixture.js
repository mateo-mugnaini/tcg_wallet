import pool from "../src/config/database.js";

const tcgId = "00000000-0000-4000-8000-000000000001";
const setId = "00000000-0000-4000-8000-000000000002";
const cardId = "00000000-0000-4000-8000-000000000003";

try {
  await pool.query(
    `
      INSERT INTO tcgs (id, name)
      VALUES ($1, 'CI Fixture TCG')
      ON CONFLICT (id) DO NOTHING
    `,
    [tcgId],
  );

  await pool.query(
    `
      INSERT INTO sets (id, tcg_id, external_id, name, code)
      VALUES ($1, $2, 'ci-fixture-set', 'CI Fixture Set', 'CI')
      ON CONFLICT (id) DO NOTHING
    `,
    [setId, tcgId],
  );

  await pool.query(
    `
      INSERT INTO cards (id, set_id, external_id, name, card_number, rarity)
      VALUES ($1, $2, 'ci-fixture-card', 'CI Fixture Card', '001', 'Common')
      ON CONFLICT (id) DO NOTHING
    `,
    [cardId, setId],
  );

  console.log("CI database fixture ready.");
} finally {
  await pool.end();
}
