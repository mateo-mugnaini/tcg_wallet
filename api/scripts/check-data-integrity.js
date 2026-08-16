import pool from "../src/config/database.js";

try {
  const result = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM card_prices WHERE price < 0) AS negative_card_prices,
      (SELECT COUNT(*) FROM graded_card_prices WHERE price < 0) AS negative_graded_prices,
      (SELECT COUNT(*) FROM graded_card_prices WHERE grade < 0 OR grade > 10)
        AS invalid_graded_grades
  `);

  const counts = Object.fromEntries(
    Object.entries(result.rows[0]).map(([key, value]) => [key, Number(value)]),
  );

  console.log(JSON.stringify({ event: "data_integrity_check", ...counts }));

  if (Object.values(counts).some((value) => value > 0)) {
    process.exitCode = 1;
  }
} finally {
  await pool.end();
}
