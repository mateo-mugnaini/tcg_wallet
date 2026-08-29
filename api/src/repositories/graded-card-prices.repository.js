import pool from "../config/database.js";

const SORT_COLUMNS = {
  recorded_at: "recorded_at",
  price: "price",
  grade: "grade",
};

function buildFilters({ cardId, gradingCompanyId, grade }) {
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

  return { values, conditions };
}

export async function createGradedCardPrice({
  cardId,
  gradingCompanyId,
  grade,
  price,
  currency,
  source,
}) {
  const result = await pool.query(
    `
      INSERT INTO graded_card_prices (
        card_id,
        grading_company_id,
        grade,
        price,
        currency,
        source
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (card_id, grading_company_id, grade, price, currency, source, recorded_at)
      DO NOTHING
      RETURNING
        id,
        card_id,
        grading_company_id,
        grade,
        price,
        currency,
        source,
        recorded_at
    `,
    [cardId, gradingCompanyId, grade, price, currency, source],
  );

  return result.rows[0];
}

export async function createGradedCardPrices(gradedCardPrices) {
  if (!Array.isArray(gradedCardPrices) || gradedCardPrices.length === 0) {
    return [];
  }

  const values = [];
  const placeholders = [];

  gradedCardPrices.forEach((gradedCardPrice, index) => {
    const baseIndex = index * 7;

    placeholders.push(
      `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, COALESCE($${baseIndex + 7}, NOW()))`,
    );

    values.push(
      gradedCardPrice.cardId,
      gradedCardPrice.gradingCompanyId,
      gradedCardPrice.grade,
      gradedCardPrice.price,
      gradedCardPrice.currency,
      gradedCardPrice.source,
      gradedCardPrice.recordedAt ?? null,
    );
  });

  const result = await pool.query(
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
      VALUES ${placeholders.join(", ")}
      ON CONFLICT (card_id, grading_company_id, grade, price, currency, source, recorded_at)
      DO NOTHING
      RETURNING
        id,
        card_id,
        grading_company_id,
        grade,
        price,
        currency,
        source,
        recorded_at
    `,
    values,
  );

  return result.rows;
}

export async function findGradedCardPrices({
  cardId,
  gradingCompanyId,
  grade,
  limit = 20,
  offset = 0,
  sortOrder = "DESC",
}) {
  const { values, conditions } = buildFilters({
    cardId,
    gradingCompanyId,
    grade,
  });

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
  const { values, conditions } = buildFilters({
    cardId,
    gradingCompanyId,
    grade,
  });

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

export async function findLatestGradedCardPrice({
  cardId,
  gradingCompanyId,
  grade,
}) {
  const { values, conditions } = buildFilters({
    cardId,
    gradingCompanyId,
    grade,
  });

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
      ORDER BY recorded_at DESC
      LIMIT 1
    `,
    values,
  );

  return result.rows[0] ?? null;
}

export async function getGradedCardPriceStats({
  cardId,
  gradingCompanyId,
  grade,
}) {
  const { values, conditions } = buildFilters({
    cardId,
    gradingCompanyId,
    grade,
  });

  const result = await pool.query(
    `
      SELECT
        COUNT(*) AS total,
        MIN(price) AS minimum_price,
        MAX(price) AS maximum_price,
        AVG(price) AS average_price
      FROM graded_card_prices
      WHERE ${conditions.join(" AND ")}
    `,
    values,
  );

  return result.rows[0];
}

export async function findLatestGradedCardPrices({
  cardId,
  gradingCompanyId,
  grade,
}) {
  const { values, conditions } = buildFilters({
    cardId,
    gradingCompanyId,
    grade,
  });

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
      ORDER BY recorded_at DESC
      LIMIT 2
    `,
    values,
  );

  return result.rows;
}

export async function getGradedCardPriceAggregations({
  cardId,
  gradingCompanyId,
  grade,
  period = "day",
}) {
  const periodExpressions = {
    day: "day",
    week: "week",
    month: "month",
  };

  const safePeriod = periodExpressions[period];

  if (!safePeriod) {
    throw new Error("Invalid graded price aggregation period");
  }

  const { values, conditions } = buildFilters({
    cardId,
    gradingCompanyId,
    grade,
  });

  const result = await pool.query(
    `
      SELECT
        DATE_TRUNC('${safePeriod}', recorded_at) AS period,
        COUNT(*) AS total,
        MIN(price) AS minimum_price,
        MAX(price) AS maximum_price,
        AVG(price) AS average_price
      FROM graded_card_prices
      WHERE ${conditions.join(" AND ")}
      GROUP BY DATE_TRUNC('${safePeriod}', recorded_at)
      ORDER BY period ASC
    `,
    values,
  );

  return result.rows;
}
