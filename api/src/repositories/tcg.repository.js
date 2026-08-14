import pool from "../config/database.js";

const TCG_COLUMNS = `
  id,
  name,
  created_at
`;

const TCG_SORT_COLUMNS = {
  name: "name",
  created_at: "created_at",
};

/* ====================================
            BUSCAR TCG POR ID
==================================== */

export async function findTcgById(id) {
  const result = await pool.query(
    `
      SELECT
        ${TCG_COLUMNS}
      FROM tcgs
      WHERE id = $1
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

/* ====================================
           BUSCAR TCG POR NOMBRE
==================================== */

export async function findTcgByName(name) {
  const result = await pool.query(
    `
      SELECT
        ${TCG_COLUMNS}
      FROM tcgs
      WHERE name = $1
    `,
    [name],
  );

  return result.rows[0] ?? null;
}

/* ====================================
              LISTAR TCGS
==================================== */

export async function findTcgs({
  search,
  limit = 10,
  offset = 0,
  sortBy = "created_at",
  sortOrder = "DESC",
}) {
  const values = [];
  const conditions = [];

  /* ====================================
              FILTRO SEARCH
  ==================================== */

  if (search) {
    values.push(`%${search}%`);

    conditions.push(`
      name ILIKE $${values.length}
    `);
  }

  /* ====================================
              PAGINACIÓN
  ==================================== */

  values.push(limit);
  const limitParameter = values.length;

  values.push(offset);
  const offsetParameter = values.length;

  /* ====================================
                WHERE
  ==================================== */

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  /* ====================================
              ORDENAMIENTO
  ==================================== */

  const sortColumn = TCG_SORT_COLUMNS[sortBy] ?? TCG_SORT_COLUMNS.created_at;

  const normalizedSortOrder = sortOrder === "ASC" ? "ASC" : "DESC";

  /* ====================================
                QUERY
  ==================================== */

  const result = await pool.query(
    `
      SELECT
        ${TCG_COLUMNS}
      FROM tcgs
      ${whereClause}
      ORDER BY ${sortColumn} ${normalizedSortOrder}
      LIMIT $${limitParameter}
      OFFSET $${offsetParameter}
    `,
    values,
  );

  return result.rows;
}

/* ====================================
             CONTAR TCGS
==================================== */

export async function countTcgs({ search }) {
  const values = [];
  const conditions = [];

  if (search) {
    values.push(`%${search}%`);

    conditions.push(`
      name ILIKE $${values.length}
    `);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await pool.query(
    `
      SELECT COUNT(*) AS total
      FROM tcgs
      ${whereClause}
    `,
    values,
  );

  return Number(result.rows[0].total);
}

/* ====================================
              CREAR TCG
==================================== */

export async function createTcg({ name }) {
  const result = await pool.query(
    `
      INSERT INTO tcgs (
        name
      )
      VALUES ($1)
      RETURNING
        ${TCG_COLUMNS}
    `,
    [name],
  );

  return result.rows[0];
}

/* ====================================
            ACTUALIZAR TCG
==================================== */

export async function updateTcg(id, { name }) {
  const fields = [];
  const values = [];

  if (name !== undefined) {
    values.push(name);
    fields.push(`name = $${values.length}`);
  }

  if (fields.length === 0) {
    return findTcgById(id);
  }

  values.push(id);

  const idParameter = values.length;

  const result = await pool.query(
    `
      UPDATE tcgs
      SET
        ${fields.join(", ")}
      WHERE id = $${idParameter}
      RETURNING
        ${TCG_COLUMNS}
    `,
    values,
  );

  return result.rows[0] ?? null;
}

/* ====================================
              ELIMINAR TCG
==================================== */

export async function deleteTcg(id) {
  const result = await pool.query(
    `
      DELETE FROM tcgs
      WHERE id = $1
      RETURNING
        ${TCG_COLUMNS}
    `,
    [id],
  );

  return result.rows[0] ?? null;
}
