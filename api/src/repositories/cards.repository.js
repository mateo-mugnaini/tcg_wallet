import pool from "../config/database.js";

// * LISTAR CARDS

export async function findCards({
  setId,
  search,
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
    conditions.push(`set_id = $${values.length}`);
  }

  //* BUSCAR POR NOMBRE
  if (search) {
    values.push(`%${search}%`);
    conditions.push(`name ILIKE $${values.length}`);
  }

  const allowedSortFields = {
    created_at: "created_at",
    updated_at: "updated_at",
    name: "name",
    card_number: "card_number",
    rarity: "rarity",
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

export async function countCards({ setId, search }) {
  const values = [];
  const conditions = [];

  /* * Filtrar por Set. */
  if (setId) {
    values.push(setId);
    conditions.push(`set_id = $${values.length}`);
  }

  /* * Buscar por nombre. */
  if (search) {
    values.push(`%${search}%`);
    conditions.push(`name ILIKE $${values.length}`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const query = `
    SELECT COUNT(*) AS total
    FROM cards
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
