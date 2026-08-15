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

const SORT_COLUMNS = {
  created_at: "ci.created_at",
  updated_at: "ci.updated_at",
  quantity: "ci.quantity",
  grade: "ci.grade",
  card_name: "c.name",
  name: "c.name",
};

export async function findCollectionItems({
  userId,
  cardId,
  condition,
  isGraded,
  setId,
  tcgId,
  rarity,
  gradingCompanyId,
  minGrade,
  maxGrade,
  limit = 20,
  offset = 0,
  sortBy = "created_at",
  sortOrder = "DESC",
}) {
  const values = [userId];
  const conditions = [`ci.user_id = $1`];

  /* ====================================
          FILTRAR POR CARD
  ==================================== */

  if (cardId) {
    values.push(cardId);
    conditions.push(`ci.card_id = $${values.length}`);
  }

  /* ====================================
          FILTRAR POR CONDITION
  ==================================== */

  if (condition) {
    values.push(condition);
    conditions.push(`ci.condition = $${values.length}`);
  }

  /* ====================================
          FILTRAR POR GRADING
  ==================================== */

  if (typeof isGraded === "boolean") {
    values.push(isGraded);
    conditions.push(`ci.is_graded = $${values.length}`);
  }

  /* ====================================
          FILTRAR POR SET
  ==================================== */

  if (setId) {
    values.push(setId);
    conditions.push(`c.set_id = $${values.length}`);
  }

  /* ====================================
          FILTRAR POR TCG
  ==================================== */

  if (tcgId) {
    values.push(tcgId);
    conditions.push(`s.tcg_id = $${values.length}`);
  }

  /* ====================================
          FILTRAR POR RARITY
  ==================================== */

  if (rarity) {
    values.push(`%${rarity}%`);
    conditions.push(`c.rarity ILIKE $${values.length}`);
  }

  /* ====================================
          FILTRAR POR GRADING COMPANY
  ==================================== */

  if (gradingCompanyId) {
    values.push(gradingCompanyId);
    conditions.push(`ci.grading_company_id = $${values.length}`);
  }

  /* ====================================
          FILTRAR POR MIN GRADE
  ==================================== */

  if (
    minGrade !== undefined &&
    minGrade !== null &&
    Number.isFinite(Number(minGrade))
  ) {
    values.push(Number(minGrade));
    conditions.push(`ci.grade >= $${values.length}`);
  }

  /* ====================================
          FILTRAR POR MAX GRADE
  ==================================== */

  if (
    maxGrade !== undefined &&
    maxGrade !== null &&
    Number.isFinite(Number(maxGrade))
  ) {
    values.push(Number(maxGrade));
    conditions.push(`ci.grade <= $${values.length}`);
  }

  /* ====================================
          ORDENAMIENTO SEGURO (WHITELIST)
  ==================================== */

  const sortColumn = SORT_COLUMNS[sortBy] ?? SORT_COLUMNS.created_at;

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
      ci.id,
      ci.user_id,
      ci.card_id,
      ci.quantity,
      ci.condition,
      ci.is_graded,
      ci.grading_company_id,
      ci.grade,
      ci.created_at,
      ci.updated_at,
      json_build_object(
        'id', c.id,
        'set_id', c.set_id,
        'external_id', c.external_id,
        'name', c.name,
        'card_number', c.card_number,
        'rarity', c.rarity,
        'image_url', c.image_url
      ) AS card,
      json_build_object(
        'id', s.id,
        'tcg_id', s.tcg_id,
        'name', s.name,
        'code', s.code,
        'release_date', s.release_date
      ) AS set,
      json_build_object(
        'id', t.id,
        'name', t.name
      ) AS tcg,
      CASE
        WHEN ci.is_graded = true AND gc.id IS NOT NULL THEN json_build_object(
          'id', gc.id,
          'name', gc.name
        )
        ELSE NULL
      END AS grading_company
    FROM collection_items ci
    INNER JOIN cards c ON ci.card_id = c.id
    INNER JOIN sets s ON c.set_id = s.id
    INNER JOIN tcgs t ON s.tcg_id = t.id
    LEFT JOIN grading_companies gc ON ci.grading_company_id = gc.id
    WHERE ${conditions.join(" AND ")}
    ORDER BY ${sortColumn} ${safeSortOrder} NULLS LAST
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
      ci.id,
      ci.user_id,
      ci.card_id,
      ci.quantity,
      ci.condition,
      ci.is_graded,
      ci.grading_company_id,
      ci.grade,
      ci.created_at,
      ci.updated_at,
      json_build_object(
        'id', c.id,
        'set_id', c.set_id,
        'external_id', c.external_id,
        'name', c.name,
        'card_number', c.card_number,
        'rarity', c.rarity,
        'image_url', c.image_url
      ) AS card,
      json_build_object(
        'id', s.id,
        'tcg_id', s.tcg_id,
        'name', s.name,
        'code', s.code,
        'release_date', s.release_date
      ) AS set,
      json_build_object(
        'id', t.id,
        'name', t.name
      ) AS tcg,
      CASE
        WHEN ci.is_graded = true AND gc.id IS NOT NULL THEN json_build_object(
          'id', gc.id,
          'name', gc.name
        )
        ELSE NULL
      END AS grading_company
    FROM collection_items ci
    INNER JOIN cards c ON ci.card_id = c.id
    INNER JOIN sets s ON c.set_id = s.id
    INNER JOIN tcgs t ON s.tcg_id = t.id
    LEFT JOIN grading_companies gc ON ci.grading_company_id = gc.id
    WHERE ci.id = $1
      AND ci.user_id = $2
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
  setId,
  tcgId,
  rarity,
  gradingCompanyId,
  minGrade,
  maxGrade,
}) {
  const values = [userId];
  const conditions = [`ci.user_id = $1`];

  /* ====================================
          FILTRAR POR CARD
  ==================================== */

  if (cardId) {
    values.push(cardId);
    conditions.push(`ci.card_id = $${values.length}`);
  }

  /* ====================================
          FILTRAR POR CONDITION
  ==================================== */

  if (condition) {
    values.push(condition);
    conditions.push(`ci.condition = $${values.length}`);
  }

  /* ====================================
          FILTRAR POR GRADING
  ==================================== */

  if (typeof isGraded === "boolean") {
    values.push(isGraded);
    conditions.push(`ci.is_graded = $${values.length}`);
  }

  /* ====================================
          FILTRAR POR SET
  ==================================== */

  if (setId) {
    values.push(setId);
    conditions.push(`c.set_id = $${values.length}`);
  }

  /* ====================================
          FILTRAR POR TCG
  ==================================== */

  if (tcgId) {
    values.push(tcgId);
    conditions.push(`s.tcg_id = $${values.length}`);
  }

  /* ====================================
          FILTRAR POR RARITY
  ==================================== */

  if (rarity) {
    values.push(`%${rarity}%`);
    conditions.push(`c.rarity ILIKE $${values.length}`);
  }

  /* ====================================
          FILTRAR POR GRADING COMPANY
  ==================================== */

  if (gradingCompanyId) {
    values.push(gradingCompanyId);
    conditions.push(`ci.grading_company_id = $${values.length}`);
  }

  /* ====================================
          FILTRAR POR MIN GRADE
  ==================================== */

  if (
    minGrade !== undefined &&
    minGrade !== null &&
    Number.isFinite(Number(minGrade))
  ) {
    values.push(Number(minGrade));
    conditions.push(`ci.grade >= $${values.length}`);
  }

  /* ====================================
          FILTRAR POR MAX GRADE
  ==================================== */

  if (
    maxGrade !== undefined &&
    maxGrade !== null &&
    Number.isFinite(Number(maxGrade))
  ) {
    values.push(Number(maxGrade));
    conditions.push(`ci.grade <= $${values.length}`);
  }

  /* ====================================
              QUERY
  ==================================== */

  const query = `
    SELECT COUNT(*) AS total
    FROM collection_items ci
    INNER JOIN cards c ON ci.card_id = c.id
    INNER JOIN sets s ON c.set_id = s.id
    INNER JOIN tcgs t ON s.tcg_id = t.id
    LEFT JOIN grading_companies gc ON ci.grading_company_id = gc.id
    WHERE ${conditions.join(" AND ")}
  `;

  const result = await pool.query(query, values);

  return Number(result.rows[0].total);
}

/* ====================================
      ESTADÍSTICAS DE COLECCIÓN
==================================== */

export async function getCollectionStats(userId) {
  /*
   * 1. Resumen global de la colección del usuario
   */
  const summaryQuery = `
    SELECT
      COUNT(*)::integer AS total_distinct_cards,
      COALESCE(SUM(quantity), 0)::integer AS total_quantity,
      COALESCE(SUM(CASE WHEN is_graded = true THEN quantity ELSE 0 END), 0)::integer AS graded_quantity,
      COALESCE(SUM(CASE WHEN is_graded = false THEN quantity ELSE 0 END), 0)::integer AS ungraded_quantity
    FROM collection_items
    WHERE user_id = $1
  `;

  /*
   * 2. Desglose por condición (Near Mint, Lightly Played, etc.)
   */
  const byConditionQuery = `
    SELECT
      condition,
      COUNT(*)::integer AS distinct_cards,
      SUM(quantity)::integer AS total_quantity
    FROM collection_items
    WHERE user_id = $1
    GROUP BY condition
    ORDER BY total_quantity DESC
  `;

  /*
   * 3. Desglose por Set
   */
  const bySetQuery = `
    SELECT
      s.id AS set_id,
      s.name AS set_name,
      s.code AS set_code,
      COUNT(ci.id)::integer AS distinct_cards,
      SUM(ci.quantity)::integer AS total_quantity
    FROM collection_items ci
    INNER JOIN cards c ON ci.card_id = c.id
    INNER JOIN sets s ON c.set_id = s.id
    WHERE ci.user_id = $1
    GROUP BY s.id, s.name, s.code
    ORDER BY total_quantity DESC
  `;

  /*
   * 4. Desglose por TCG
   */
  const byTcgQuery = `
    SELECT
      t.id AS tcg_id,
      t.name AS tcg_name,
      COUNT(ci.id)::integer AS distinct_cards,
      SUM(ci.quantity)::integer AS total_quantity
    FROM collection_items ci
    INNER JOIN cards c ON ci.card_id = c.id
    INNER JOIN sets s ON c.set_id = s.id
    INNER JOIN tcgs t ON s.tcg_id = t.id
    WHERE ci.user_id = $1
    GROUP BY t.id, t.name
    ORDER BY total_quantity DESC
  `;

  /*
   * 5. Desglose por empresa de grading
   */
  const byGradingCompanyQuery = `
    SELECT
      gc.id AS grading_company_id,
      gc.name AS grading_company_name,
      COUNT(ci.id)::integer AS distinct_cards,
      SUM(ci.quantity)::integer AS total_quantity
    FROM collection_items ci
    INNER JOIN grading_companies gc ON ci.grading_company_id = gc.id
    WHERE ci.user_id = $1
      AND ci.is_graded = true
    GROUP BY gc.id, gc.name
    ORDER BY total_quantity DESC
  `;

  const [summaryRes, byConditionRes, bySetRes, byTcgRes, byGradingCompanyRes] =
    await Promise.all([
      pool.query(summaryQuery, [userId]),
      pool.query(byConditionQuery, [userId]),
      pool.query(bySetQuery, [userId]),
      pool.query(byTcgQuery, [userId]),
      pool.query(byGradingCompanyQuery, [userId]),
    ]);

  const summary = summaryRes.rows[0] ?? {
    total_distinct_cards: 0,
    total_quantity: 0,
    graded_quantity: 0,
    ungraded_quantity: 0,
  };

  return {
    summary: {
      totalDistinctCards: Number(summary.total_distinct_cards),
      totalQuantity: Number(summary.total_quantity),
      gradedQuantity: Number(summary.graded_quantity),
      ungradedQuantity: Number(summary.ungraded_quantity),
    },
    byCondition: byConditionRes.rows.map((row) => ({
      condition: row.condition,
      distinctCards: Number(row.distinct_cards),
      totalQuantity: Number(row.total_quantity),
    })),
    bySet: bySetRes.rows.map((row) => ({
      setId: row.set_id,
      setName: row.set_name,
      setCode: row.set_code,
      distinctCards: Number(row.distinct_cards),
      totalQuantity: Number(row.total_quantity),
    })),
    byTcg: byTcgRes.rows.map((row) => ({
      tcgId: row.tcg_id,
      tcgName: row.tcg_name,
      distinctCards: Number(row.distinct_cards),
      totalQuantity: Number(row.total_quantity),
    })),
    byGradingCompany: byGradingCompanyRes.rows.map((row) => ({
      gradingCompanyId: row.grading_company_id,
      gradingCompanyName: row.grading_company_name,
      distinctCards: Number(row.distinct_cards),
      totalQuantity: Number(row.total_quantity),
    })),
  };
}
