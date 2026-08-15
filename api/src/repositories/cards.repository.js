import pool from "../config/database.js";

// * LISTAR CARDS

export async function findCards({
  setId,
  tcgId,
  search,
  rarity,
  cardNumber,
  externalId,
  limit = 10,
  offset = 0,
  sortBy = "created_at",
  sortOrder = "DESC",
}) {
  const values = [];
  const conditions = [];

  //* FILTRAR POR SET
  if (setId) {
    values.push(setId);
    conditions.push(`c.set_id = $${values.length}`);
  }

  if (tcgId) {
    values.push(tcgId);
    conditions.push(`s.tcg_id = $${values.length}`);
  }

  //* BUSCAR POR NOMBRE
  if (search) {
    values.push(`%${search}%`);
    conditions.push(`c.name ILIKE $${values.length}`);
  }

  if (rarity) {
    values.push(`%${rarity}%`);
    conditions.push(`c.rarity ILIKE $${values.length}`);
  }

  if (cardNumber) {
    values.push(cardNumber);
    conditions.push(`c.card_number = $${values.length}`);
  }

  if (externalId) {
    values.push(externalId);
    conditions.push(`c.external_id = $${values.length}`);
  }

  const allowedSortFields = {
    created_at: "c.created_at",
    updated_at: "c.updated_at",
    name: "c.name",
    card_number: "c.card_number",
    external_id: "c.external_id",
    rarity: "c.rarity",
  };

  const safeSortBy = allowedSortFields[sortBy] ?? "created_at";

  /* * El orden solo puede ser ASC o DESC. */
  const safeSortOrder =
    String(sortOrder).toUpperCase() === "ASC" ? "ASC" : "DESC";

  /* * Paginación. */
  values.push(limit);
  const limitIndex = values.length;

  values.push(offset);
  const offsetIndex = values.length;

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const query = `
    SELECT
      c.id,
      c.set_id,
      c.external_id,
      c.name,
      c.card_number,
      c.rarity,
      c.image_url,
      c.created_at,
      c.updated_at
    FROM cards c
    INNER JOIN sets s ON s.id = c.set_id
    ${whereClause}
    ORDER BY ${safeSortBy} ${safeSortOrder}
    LIMIT $${limitIndex}
    OFFSET $${offsetIndex}
  `;

  const result = await pool.query(query, values);

  return result.rows;
}

/* ====================================
        CONTAR CARDS
==================================== */

export async function countCards({
  setId,
  tcgId,
  search,
  rarity,
  cardNumber,
  externalId,
}) {
  const values = [];
  const conditions = [];

  /* * Filtrar por Set. */
  if (setId) {
    values.push(setId);
    conditions.push(`c.set_id = $${values.length}`);
  }

  if (tcgId) {
    values.push(tcgId);
    conditions.push(`s.tcg_id = $${values.length}`);
  }

  /* * Buscar por nombre. */
  if (search) {
    values.push(`%${search}%`);
    conditions.push(`c.name ILIKE $${values.length}`);
  }

  if (rarity) {
    values.push(`%${rarity}%`);
    conditions.push(`c.rarity ILIKE $${values.length}`);
  }

  if (cardNumber) {
    values.push(cardNumber);
    conditions.push(`c.card_number = $${values.length}`);
  }

  if (externalId) {
    values.push(externalId);
    conditions.push(`c.external_id = $${values.length}`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const query = `
    SELECT COUNT(*) AS total
    FROM cards c
    INNER JOIN sets s ON s.id = c.set_id
    ${whereClause}
  `;

  const result = await pool.query(query, values);

  return Number(result.rows[0].total);
}

/* ====================================
      BUSCAR CARD POR ID
==================================== */

export async function findCardById(id) {
  const query = `
    SELECT
      id,
      set_id,
      external_id,
      name,
      card_number,
      rarity,
      image_url,
      created_at,
      updated_at
    FROM cards
    WHERE id = $1
  `;

  const result = await pool.query(query, [id]);

  return result.rows[0] ?? null;
}

/* ====================================
    BUSCAR CARD POR EXTERNAL ID
==================================== */

export async function findCardByExternalId(setId, externalId) {
  const query = `
    SELECT
      id,
      set_id,
      external_id,
      name,
      card_number,
      rarity,
      image_url,
      created_at,
      updated_at
    FROM cards
    WHERE set_id = $1
      AND external_id = $2
  `;

  const result = await pool.query(query, [setId, externalId]);

  return result.rows[0] ?? null;
}

/* ====================================
      BUSCAR CARD POR NOMBRE
==================================== */

export async function findCardByName(setId, name) {
  const query = `
    SELECT
      id,
      set_id,
      external_id,
      name,
      card_number,
      rarity,
      image_url,
      created_at,
      updated_at
    FROM cards
    WHERE set_id = $1
      AND name = $2
  `;

  const result = await pool.query(query, [setId, name]);

  return result.rows[0] ?? null;
}

/* ====================================
          CREAR CARD
==================================== */

export async function createCard({
  setId,
  externalId,
  name,
  cardNumber,
  rarity,
  imageUrl,
}) {
  const query = `
    INSERT INTO cards (
      set_id,
      external_id,
      name,
      card_number,
      rarity,
      image_url
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING
      id,
      set_id,
      external_id,
      name,
      card_number,
      rarity,
      image_url,
      created_at,
      updated_at
  `;

  const values = [setId, externalId, name, cardNumber, rarity, imageUrl];

  const result = await pool.query(query, values);

  return result.rows[0];
}

/* ====================================
        ACTUALIZAR CARD
==================================== */

export async function updateCard(
  id,
  { setId, externalId, name, cardNumber, rarity, imageUrl },
) {
  const query = `
    UPDATE cards
    SET
      set_id = COALESCE($1, set_id),
      external_id = COALESCE($2, external_id),
      name = COALESCE($3, name),
      card_number = COALESCE($4, card_number),
      rarity = COALESCE($5, rarity),
      image_url = COALESCE($6, image_url),
      updated_at = NOW()
    WHERE id = $7
    RETURNING
      id,
      set_id,
      external_id,
      name,
      card_number,
      rarity,
      image_url,
      created_at,
      updated_at
  `;

  const values = [setId, externalId, name, cardNumber, rarity, imageUrl, id];

  const result = await pool.query(query, values);

  return result.rows[0] ?? null;
}

/* ====================================
        ELIMINAR CARD
==================================== */

export async function deleteCard(id) {
  const query = `
    DELETE FROM cards
    WHERE id = $1
    RETURNING
      id,
      set_id,
      external_id,
      name,
      card_number,
      rarity,
      image_url,
      created_at,
      updated_at
  `;

  const result = await pool.query(query, [id]);

  return result.rows[0] ?? null;
}

/* ====================================
             UPSERT
==================================== */

export async function upsertCard({
  setId,
  externalId,
  name,
  cardNumber,
  rarity,
  imageUrl,
}) {
  const query = `
    INSERT INTO cards (
      set_id,
      external_id,
      name,
      card_number,
      rarity,
      image_url
    )
    VALUES ($1, $2, $3, $4, $5, $6)

    ON CONFLICT (set_id, external_id)
    DO UPDATE SET
      name = EXCLUDED.name,
      card_number = EXCLUDED.card_number,
      rarity = EXCLUDED.rarity,
      image_url = EXCLUDED.image_url,
      updated_at = NOW()

    RETURNING
      id,
      set_id,
      external_id,
      name,
      card_number,
      rarity,
      image_url,
      created_at,
      updated_at
  `;

  const values = [setId, externalId, name, cardNumber, rarity, imageUrl];

  const result = await pool.query(query, values);

  return result.rows[0];
}

/* ====================================
    BUSCAR CARDS POR EXTERNAL IDS
==================================== */

export async function findCardsByExternalIds({ setId, externalIds }) {
  if (!setId || !Array.isArray(externalIds) || externalIds.length === 0) {
    return [];
  }

  const query = `
    SELECT
      id,
      set_id,
      external_id,
      name,
      card_number,
      rarity,
      image_url,
      created_at,
      updated_at
    FROM cards
    WHERE set_id = $1
      AND external_id = ANY($2::text[])
  `;

  const values = [setId, externalIds];

  const result = await pool.query(query, values);

  return result.rows;
}

/* ====================================
       DETALLE ENRIQUECIDO DE CARD
==================================== */

export async function findCardDetailsById(id, userId) {
  const result = await pool.query(
    `
      SELECT
        c.id,
        c.set_id,
        c.external_id,
        c.name,
        c.card_number,
        c.rarity,
        c.image_url,
        c.created_at,
        c.updated_at,
        json_build_object(
          'id', s.id,
          'tcg_id', s.tcg_id,
          'external_id', s.external_id,
          'name', s.name,
          'code', s.code,
          'release_date', s.release_date
        ) AS set,
        json_build_object(
          'id', t.id,
          'name', t.name
        ) AS tcg,
        COALESCE(latest_prices.data, '[]'::json) AS latest_prices,
        json_build_object(
          'item_count', COALESCE(collection.item_count, 0),
          'total_quantity', COALESCE(collection.total_quantity, 0),
          'graded_quantity', COALESCE(collection.graded_quantity, 0)
        ) AS collection
      FROM cards c
      INNER JOIN sets s ON s.id = c.set_id
      INNER JOIN tcgs t ON t.id = s.tcg_id
      LEFT JOIN LATERAL (
        SELECT json_agg(
          json_build_object(
            'id', latest.id,
            'card_id', latest.card_id,
            'condition', latest.condition,
            'price', latest.price,
            'currency', latest.currency,
            'source', latest.source,
            'recorded_at', latest.recorded_at
          )
          ORDER BY latest.recorded_at DESC
        ) AS data
        FROM (
          SELECT DISTINCT ON (condition, source)
            id,
            card_id,
            condition,
            price,
            currency,
            source,
            recorded_at
          FROM card_prices
          WHERE card_id = c.id
          ORDER BY condition, source, recorded_at DESC
        ) latest
      ) latest_prices ON TRUE
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*)::int AS item_count,
          COALESCE(SUM(quantity), 0)::int AS total_quantity,
          COALESCE(
            SUM(CASE WHEN is_graded = TRUE THEN quantity ELSE 0 END),
            0
          )::int AS graded_quantity
        FROM collection_items
        WHERE card_id = c.id
          AND user_id = $2
      ) collection ON TRUE
      WHERE c.id = $1
    `,
    [id, userId],
  );

  return result.rows[0] ?? null;
}

export async function findCardsByIds(cardIds) {
  if (!Array.isArray(cardIds) || cardIds.length === 0) {
    return [];
  }

  const result = await pool.query(
    `
      SELECT id
      FROM cards
      WHERE id = ANY($1::uuid[])
    `,
    [cardIds],
  );

  return result.rows;
}
