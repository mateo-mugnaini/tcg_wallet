import pool from "../config/database.js";

/* ====================================
        LISTAR CARD PRICES
==================================== */

export async function findCardPrices({
  cardId,
  source,
  condition,
  limit = 20,
  offset = 0,
  sortOrder = "DESC",
}) {
  const values = [];
  const conditions = [];

  /* ====================================
          FILTRAR POR CARD
  ==================================== */

  if (cardId) {
    values.push(cardId);
    conditions.push(`card_id = $${values.length}`);
  }

  /* ====================================
          FILTRAR POR SOURCE
  ==================================== */

  if (source) {
    values.push(source);
    conditions.push(`source = $${values.length}`);
  }

  /* ====================================
          FILTRAR POR CONDITION
  ==================================== */

  if (condition) {
    values.push(condition);
    conditions.push(`condition = $${values.length}`);
  }

  /* ====================================
          ORDENAMIENTO
  ==================================== */

  const safeSortOrder =
    String(sortOrder).toUpperCase() === "ASC" ? "ASC" : "DESC";

  /* ====================================
          PAGINACIÓN
  ==================================== */

  values.push(limit);
  const limitIndex = values.length;

  values.push(offset);
  const offsetIndex = values.length;

  /* ====================================
              WHERE
  ==================================== */

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  /* ====================================
              QUERY
  ==================================== */

  const query = `
    SELECT
      id,
      card_id,
      condition,
      price,
      currency,
      source,
      recorded_at
    FROM card_prices
    ${whereClause}
    ORDER BY recorded_at ${safeSortOrder}
    LIMIT $${limitIndex}
    OFFSET $${offsetIndex}
  `;

  const result = await pool.query(query, values);

  return result.rows;
}

/* ====================================
        CONTAR CARD PRICES
==================================== */

export async function countCardPrices({ cardId, source, condition }) {
  const values = [];
  const conditions = [];

  /* ====================================
          FILTRAR POR CARD
  ==================================== */

  if (cardId) {
    values.push(cardId);
    conditions.push(`card_id = $${values.length}`);
  }

  /* ====================================
          FILTRAR POR SOURCE
  ==================================== */

  if (source) {
    values.push(source);
    conditions.push(`source = $${values.length}`);
  }

  /* ====================================
          FILTRAR POR CONDITION
  ==================================== */

  if (condition) {
    values.push(condition);
    conditions.push(`condition = $${values.length}`);
  }

  /* ====================================
              WHERE
  ==================================== */

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  /* ====================================
              QUERY
  ==================================== */

  const query = `
    SELECT COUNT(*) AS total
    FROM card_prices
    ${whereClause}
  `;

  const result = await pool.query(query, values);

  return Number(result.rows[0].total);
}

/* ====================================
        ÚLTIMO CARD PRICE
==================================== */

export async function findLatestCardPrice({ cardId, source, condition }) {
  const values = [];
  const conditions = [];

  /* ====================================
          CARD
  ==================================== */

  values.push(cardId);
  conditions.push(`card_id = $${values.length}`);

  /* ====================================
          SOURCE
  ==================================== */

  if (source) {
    values.push(source);
    conditions.push(`source = $${values.length}`);
  }

  /* ====================================
          CONDITION
  ==================================== */

  if (condition) {
    values.push(condition);
    conditions.push(`condition = $${values.length}`);
  }

  /* ====================================
              QUERY
  ==================================== */

  const query = `
    SELECT
      id,
      card_id,
      condition,
      price,
      currency,
      source,
      recorded_at
    FROM card_prices
    WHERE ${conditions.join(" AND ")}
    ORDER BY recorded_at DESC
    LIMIT 1
  `;

  const result = await pool.query(query, values);

  return result.rows[0] ?? null;
}

/* ====================================
        CREAR CARD PRICE
==================================== */

export async function createCardPrice({
  cardId,
  condition,
  price,
  currency,
  source,
}) {
  const query = `
    INSERT INTO card_prices (
      card_id,
      condition,
      price,
      currency,
      source
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING
      id,
      card_id,
      condition,
      price,
      currency,
      source,
      recorded_at
  `;

  const values = [cardId, condition, price, currency, source];

  const result = await pool.query(query, values);

  return result.rows[0];
}

/* ====================================
        ESTADÍSTICAS CARD PRICE
==================================== */

export async function getCardPriceStats({ cardId, source, condition }) {
  const values = [cardId];
  const conditions = [`card_id = $1`];

  if (source) {
    values.push(source);
    conditions.push(`source = $${values.length}`);
  }

  if (condition) {
    values.push(condition);
    conditions.push(`condition = $${values.length}`);
  }

  const query = `
    SELECT
      COUNT(*) AS total,
      MIN(price) AS minimum_price,
      MAX(price) AS maximum_price,
      AVG(price) AS average_price
    FROM card_prices
    WHERE ${conditions.join(" AND ")}
  `;

  const result = await pool.query(query, values);

  return result.rows[0];
}

/* ====================================
        OBTENER ÚLTIMOS PRECIOS
==================================== */

export async function findLatestCardPrices({ cardId, source, condition }) {
  const values = [cardId];
  const conditions = [`card_id = $1`];

  /* ====================================
          FILTRAR POR SOURCE
  ==================================== */

  if (source) {
    values.push(source);
    conditions.push(`source = $${values.length}`);
  }

  /* ====================================
          FILTRAR POR CONDITION
  ==================================== */

  if (condition) {
    values.push(condition);
    conditions.push(`condition = $${values.length}`);
  }

  /* ====================================
              QUERY
  ==================================== */

  const query = `
    SELECT
      id,
      card_id,
      condition,
      price,
      currency,
      source,
      recorded_at
    FROM card_prices
    WHERE ${conditions.join(" AND ")}
    ORDER BY recorded_at DESC
    LIMIT 2
  `;

  const result = await pool.query(query, values);

  return result.rows;
}

/* ====================================
        AGREGACIONES CARD PRICE
==================================== */

export async function getCardPriceAggregations({
  cardId,
  source,
  condition,
  period = "day",
}) {
  const values = [cardId];
  const conditions = [`card_id = $1`];

  /* ====================================
          FILTRAR POR SOURCE
  ==================================== */

  if (source) {
    values.push(source);
    conditions.push(`source = $${values.length}`);
  }

  /* ====================================
          FILTRAR POR CONDITION
  ==================================== */

  if (condition) {
    values.push(condition);
    conditions.push(`condition = $${values.length}`);
  }

  /* ====================================
          PERÍODO
  ==================================== */

  const allowedPeriods = {
    day: "day",
    week: "week",
    month: "month",
  };

  const safePeriod = allowedPeriods[period] ?? "day";

  /* ====================================
              QUERY
  ==================================== */

  const query = `
    SELECT
      DATE_TRUNC('${safePeriod}', recorded_at) AS period,
      COUNT(*) AS total,
      MIN(price) AS minimum_price,
      MAX(price) AS maximum_price,
      AVG(price) AS average_price
    FROM card_prices
    WHERE ${conditions.join(" AND ")}
    GROUP BY DATE_TRUNC('${safePeriod}', recorded_at)
    ORDER BY period ASC
  `;

  const result = await pool.query(query, values);

  return result.rows;
}

/* ====================================
    BUSCAR PRECIOS DE VARIAS CARDS
==================================== */

export async function findCardPricesByCardIds({ cardIds, source }) {
  if (!cardIds || cardIds.length === 0) {
    return [];
  }

  const values = [cardIds];
  const conditions = ["card_id = ANY($1::uuid[])"];

  if (source) {
    values.push(source);
    conditions.push(`source = $${values.length}`);
  }

  const query = `
    SELECT
      id,
      card_id,
      condition,
      price,
      currency,
      source,
      recorded_at
    FROM card_prices
    WHERE ${conditions.join(" AND ")}
  `;

  const result = await pool.query(query, values);

  return result.rows;
}

/* ====================================
      CREAR CARD PRICES EN LOTE
==================================== */

export async function createCardPrices(cardPrices) {
  if (!cardPrices || cardPrices.length === 0) {
    return [];
  }

  const values = [];
  const placeholders = [];

  cardPrices.forEach((cardPrice, index) => {
    const baseIndex = index * 5;

    placeholders.push(
      `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5})`,
    );

    values.push(
      cardPrice.cardId,
      cardPrice.condition,
      cardPrice.price,
      cardPrice.currency,
      cardPrice.source,
    );
  });

  const query = `
    INSERT INTO card_prices (
      card_id,
      condition,
      price,
      currency,
      source
    )
    VALUES ${placeholders.join(", ")}
    RETURNING
      id,
      card_id,
      condition,
      price,
      currency,
      source,
      recorded_at
  `;

  const result = await pool.query(query, values);

  return result.rows;
}

/* ====================================
    ÚLTIMOS PRECIOS POR CARDS
==================================== */

export async function findLatestCardPricesByCardIds({ cardIds, source }) {
  if (!Array.isArray(cardIds) || cardIds.length === 0) {
    return [];
  }

  const values = [cardIds];

  let sourceCondition = "";

  if (source) {
    values.push(source);
    sourceCondition = `AND source = $${values.length}`;
  }

  const query = `
    SELECT DISTINCT ON (card_id, condition)
      id,
      card_id,
      condition,
      price,
      currency,
      source,
      recorded_at
    FROM card_prices
    WHERE card_id = ANY($1)
      ${sourceCondition}
    ORDER BY
      card_id,
      condition,
      recorded_at DESC
  `;

  const result = await pool.query(query, values);

  return result.rows;
}
