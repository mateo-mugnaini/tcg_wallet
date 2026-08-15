import pool from "../config/database.js";

const SORT_COLUMNS = {
  recorded_at: "recorded_at",
  price: "price",
  grade: "grade",
};

export async function findGradedCardPrices({
  cardId,
  gradingCompanyId,
  grade,
  limit = 20,
  offset = 0,
  sortOrder = "DESC",
}) {
  const values = [cardId];
  const conditions = [`card_id = $1`];

  if (gradingCompanyId) {
    values.push(gradingCompanyId);
    conditions.push(`grading_company_id = $${values.length}`);
  }

  if (grade !== undefined) {
    values.push(grade);
    conditions.push(`grade = $${values.length}`);
  }

  const sortColumn = SORT_COLUMNS.recorded_at;
  const safeSortOrder =
    String(sortOrder).toUpperCase() === "ASC" ? "ASC" : "DESC";

  values.push(limit);
  const limitIndex = values.length;

  values.push(offset);
  const offsetIndex = values.length;

  const result = await pool.query(
    `
      SELECT
        id,
        card_id,
        grading_company_id,
        grade,
        price,
        currency,
        source,
        recorded_at
      FROM graded_card_prices
      WHERE ${conditions.join(" AND ")}
      ORDER BY ${sortColumn} ${safeSortOrder}
      LIMIT $${limitIndex}
      OFFSET $${offsetIndex}
    `,
    values,
  );

  return result.rows;
}

export async function countGradedCardPrices({
  cardId,
  gradingCompanyId,
  grade,
}) {
  const values = [cardId];
  const conditions = [`card_id = $1`];

  if (gradingCompanyId) {
    values.push(gradingCompanyId);
    conditions.push(`grading_company_id = $${values.length}`);
  }

  if (grade !== undefined) {
    values.push(grade);
    conditions.push(`grade = $${values.length}`);
  }

  const result = await pool.query(
    `
      SELECT COUNT(*) AS total
      FROM graded_card_prices
      WHERE ${conditions.join(" AND ")}
    `,
    values,
  );

  return Number(result.rows[0].total);
}
