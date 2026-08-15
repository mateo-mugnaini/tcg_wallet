import pool from "../config/database.js";

/* ====================================
        CREAR COLLECTION ITEM
==================================== */

export async function createCollectionItem({
  userId,
  cardId,
  quantity,
  condition,
  isGraded = false,
  gradingCompanyId = null,
  grade = null,
}) {
  const query = `
    INSERT INTO collection_items (
      user_id,
      card_id,
      quantity,
      condition,
      is_graded,
      grading_company_id,
      grade
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING
      id,
      user_id,
      card_id,
      quantity,
      condition,
      is_graded,
      grading_company_id,
      grade,
      created_at,
      updated_at
  `;

  const values = [
    userId,
    cardId,
    quantity,
    condition,
    isGraded,
    gradingCompanyId,
    grade,
  ];

  const result = await pool.query(query, values);

  return result.rows[0];
}

/* ====================================
        LISTAR COLLECTION ITEMS
==================================== */

export async function findCollectionItems({
  userId,
  cardId,
  condition,
  isGraded,
  limit = 20,
  offset = 0,
  sortOrder = "DESC",
}) {
  const values = [userId];
  const conditions = [`user_id = $1`];

  /* ====================================
          FILTRAR POR CARD
  ==================================== */

  if (cardId) {
    values.push(cardId);
    conditions.push(`card_id = $${values.length}`);
  }

  /* ====================================
          FILTRAR POR CONDITION
  ==================================== */

  if (condition) {
    values.push(condition);
    conditions.push(`condition = $${values.length}`);
  }

  /* ====================================
          FILTRAR POR GRADING
  ==================================== */

  if (typeof isGraded === "boolean") {
    values.push(isGraded);
    conditions.push(`is_graded = $${values.length}`);
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
              QUERY
==================================== */

  const query = `
    SELECT
      id,
      user_id,
      card_id,
      quantity,
      condition,
      is_graded,
      grading_company_id,
      grade,
      created_at,
      updated_at
    FROM collection_items
    WHERE ${conditions.join(" AND ")}
    ORDER BY created_at ${safeSortOrder}
    LIMIT $${limitIndex}
    OFFSET $${offsetIndex}
  `;

  const result = await pool.query(query, values);

  return result.rows;
}

/* ====================================
      BUSCAR COLLECTION ITEM POR ID
==================================== */

export async function findCollectionItemById(id, userId) {
  const query = `
    SELECT
      id,
      user_id,
      card_id,
      quantity,
      condition,
      is_graded,
      grading_company_id,
      grade,
      created_at,
      updated_at
    FROM collection_items
    WHERE id = $1
      AND user_id = $2
  `;

  const result = await pool.query(query, [id, userId]);

  return result.rows[0] ?? null;
}

/* ====================================
        ACTUALIZAR COLLECTION ITEM
==================================== */

export async function updateCollectionItem(
  id,
  userId,
  { quantity, condition, isGraded, gradingCompanyId, grade },
) {
  const query = `
    UPDATE collection_items
    SET
      quantity = COALESCE($1, quantity),
      condition = COALESCE($2, condition),
      is_graded = COALESCE($3, is_graded),
      grading_company_id = $4,
      grade = $5,
      updated_at = NOW()
    WHERE id = $6
      AND user_id = $7
    RETURNING
      id,
      user_id,
      card_id,
      quantity,
      condition,
      is_graded,
      grading_company_id,
      grade,
      created_at,
      updated_at
  `;

  const values = [
    quantity,
    condition,
    isGraded,
    gradingCompanyId,
    grade,
    id,
    userId,
  ];

  const result = await pool.query(query, values);

  return result.rows[0] ?? null;
}

/* ====================================
        ELIMINAR COLLECTION ITEM
==================================== */

export async function deleteCollectionItem(id, userId) {
  const query = `
    DELETE FROM collection_items
    WHERE id = $1
      AND user_id = $2
    RETURNING
      id,
      user_id,
      card_id,
      quantity,
      condition,
      is_graded,
      grading_company_id,
      grade,
      created_at,
      updated_at
  `;

  const result = await pool.query(query, [id, userId]);

  return result.rows[0] ?? null;
}

/* ====================================
        CONTAR COLLECTION ITEMS
==================================== */

export async function countCollectionItems({
  userId,
  cardId,
  condition,
  isGraded,
}) {
  const values = [userId];
  const conditions = [`user_id = $1`];

  /* ====================================
          FILTRAR POR CARD
  ==================================== */

  if (cardId) {
    values.push(cardId);
    conditions.push(`card_id = $${values.length}`);
  }

  /* ====================================
          FILTRAR POR CONDITION
  ==================================== */

  if (condition) {
    values.push(condition);
    conditions.push(`condition = $${values.length}`);
  }

  /* ====================================
          FILTRAR POR GRADING
  ==================================== */

  if (typeof isGraded === "boolean") {
    values.push(isGraded);
    conditions.push(`is_graded = $${values.length}`);
  }

  /* ====================================
              QUERY
  ==================================== */

  const query = `
    SELECT COUNT(*) AS total
    FROM collection_items
    WHERE ${conditions.join(" AND ")}
  `;

  const result = await pool.query(query, values);

  return Number(result.rows[0].total);
}
