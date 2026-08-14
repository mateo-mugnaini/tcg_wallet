import pool from "../config/database.js";

/* ====================================
              COLUMNAS SET
==================================== */

const SET_COLUMNS = `
  id,
  tcg_id,
  external_id,
  name,
  code,
  release_date,
  created_at
`;

/* ====================================
            COLUMNAS ORDENABLES
==================================== */

const SET_SORT_COLUMNS = {
  name: "name",
  code: "code",
  release_date: "release_date",
  created_at: "created_at",
};

/* ====================================
          BUSCAR SET POR ID
==================================== */

export async function findSetById(id) {
  const result = await pool.query(
    `
      SELECT
        ${SET_COLUMNS}
      FROM sets
      WHERE id = $1
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

/* ====================================
       BUSCAR SET POR NOMBRE
==================================== */

export async function findSetByName(tcgId, name) {
  const result = await pool.query(
    `
      SELECT
        ${SET_COLUMNS}
      FROM sets
      WHERE tcg_id = $1
        AND name = $2
    `,
    [tcgId, name],
  );

  return result.rows[0] ?? null;
}

/* ====================================
     BUSCAR SET POR EXTERNAL ID
==================================== */

export async function findSetByExternalId(tcgId, externalId) {
  const result = await pool.query(
    `
      SELECT
        ${SET_COLUMNS}
      FROM sets
      WHERE tcg_id = $1
        AND external_id = $2
    `,
    [tcgId, externalId],
  );

  return result.rows[0] ?? null;
}

/* ====================================
              CREAR SET
==================================== */

export async function createSet({
  tcgId,
  externalId,
  name,
  code,
  releaseDate,
}) {
  const result = await pool.query(
    `
      INSERT INTO sets (
        tcg_id,
        external_id,
        name,
        code,
        release_date
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        ${SET_COLUMNS}
    `,
    [tcgId, externalId, name, code, releaseDate],
  );

  return result.rows[0];
}

/* ====================================
             LISTAR SETS
==================================== */

export async function findSets({
  tcgId,
  search,
  limit,
  offset,
  sortBy,
  sortOrder,
}) {
  const values = [];
  const conditions = [];

  /* ------------------------------------
          FILTRAR POR TCG
  ------------------------------------ */

  if (tcgId) {
    values.push(tcgId);

    conditions.push(`tcg_id = $${values.length}`);
  }

  /* ------------------------------------
              BUSCAR
  ------------------------------------ */

  if (search) {
    values.push(`%${search}%`);

    conditions.push(`
      (
        name ILIKE $${values.length}
        OR code ILIKE $${values.length}
        OR external_id ILIKE $${values.length}
      )
    `);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  /* ------------------------------------
          PAGINACIÓN
  ------------------------------------ */

  values.push(limit);

  const limitParameter = values.length;

  values.push(offset);

  const offsetParameter = values.length;

  /* ------------------------------------
              ORDER BY
  ------------------------------------ */

  const sortColumn = SET_SORT_COLUMNS[sortBy] ?? SET_SORT_COLUMNS.created_at;

  const result = await pool.query(
    `
      SELECT
        ${SET_COLUMNS}
      FROM sets
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT $${limitParameter}
      OFFSET $${offsetParameter}
    `,
    values,
  );

  return result.rows;
}

/* ====================================
             CONTAR SETS
==================================== */

export async function countSets({ tcgId, search }) {
  const values = [];
  const conditions = [];

  /* ------------------------------------
          FILTRAR POR TCG
  ------------------------------------ */

  if (tcgId) {
    values.push(tcgId);

    conditions.push(`tcg_id = $${values.length}`);
  }

  /* ------------------------------------
              BUSCAR
  ------------------------------------ */

  if (search) {
    values.push(`%${search}%`);

    conditions.push(`
      (
        name ILIKE $${values.length}
        OR code ILIKE $${values.length}
        OR external_id ILIKE $${values.length}
      )
    `);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await pool.query(
    `
      SELECT COUNT(*) AS total
      FROM sets
      ${whereClause}
    `,
    values,
  );

  return Number(result.rows[0].total);
}

/* ====================================
            ACTUALIZAR SET
==================================== */

export async function updateSet(
  id,
  { tcgId, externalId, name, code, releaseDate },
) {
  const fields = [];
  const values = [];

  /* ------------------------------------
              TCG
  ------------------------------------ */

  if (tcgId !== undefined) {
    values.push(tcgId);

    fields.push(`tcg_id = $${values.length}`);
  }

  /* ------------------------------------
          EXTERNAL ID
  ------------------------------------ */

  if (externalId !== undefined) {
    values.push(externalId);

    fields.push(`external_id = $${values.length}`);
  }

  /* ------------------------------------
              NAME
  ------------------------------------ */

  if (name !== undefined) {
    values.push(name);

    fields.push(`name = $${values.length}`);
  }

  /* ------------------------------------
              CODE
  ------------------------------------ */

  if (code !== undefined) {
    values.push(code);

    fields.push(`code = $${values.length}`);
  }

  /* ------------------------------------
          RELEASE DATE
  ------------------------------------ */

  if (releaseDate !== undefined) {
    values.push(releaseDate);

    fields.push(`release_date = $${values.length}`);
  }

  /*
   * El service ya valida que exista
   * al menos un campo.
   */

  if (fields.length === 0) {
    return findSetById(id);
  }

  /* ------------------------------------
              ID
  ------------------------------------ */

  values.push(id);

  const idParameter = values.length;

  const result = await pool.query(
    `
      UPDATE sets
      SET
        ${fields.join(", ")}
      WHERE id = $${idParameter}
      RETURNING
        ${SET_COLUMNS}
    `,
    values,
  );

  return result.rows[0] ?? null;
}

/* ====================================
             ELIMINAR SET
==================================== */

export async function deleteSet(id) {
  const result = await pool.query(
    `
      DELETE FROM sets
      WHERE id = $1
      RETURNING
        ${SET_COLUMNS}
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

/* ====================================
          UPSERT SET
==================================== */

export async function upsertSet({
  tcgId,
  externalId,
  name,
  code,
  releaseDate,
}) {
  const result = await pool.query(
    `
      INSERT INTO sets (
        tcg_id,
        external_id,
        name,
        code,
        release_date
      )
      VALUES ($1, $2, $3, $4, $5)

      ON CONFLICT (tcg_id, external_id)
      DO UPDATE SET
        name = EXCLUDED.name,
        code = EXCLUDED.code,
        release_date = EXCLUDED.release_date

      RETURNING
        ${SET_COLUMNS}
    `,
    [tcgId, externalId, name, code, releaseDate],
  );

  return result.rows[0];
}
