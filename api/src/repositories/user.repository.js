import pool from "../config/database.js";

const USER_COLUMNS = `
  id,
  username,
  email,
  created_at,
  updated_at
`;

const USER_SORT_COLUMNS = {
  username: "username",
  email: "email",
  created_at: "created_at",
  updated_at: "updated_at",
};

/* ====================================
            BUSCAR USUARIO POR ID
==================================== */
export async function findUserById(id) {
  const result = await pool.query(
    `
      SELECT
        ${USER_COLUMNS}
      FROM users
      WHERE id = $1
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

/* ====================================
        BUSCAR USUARIO POR USERNAME
==================================== */
export async function findUserByUsername(username) {
  const result = await pool.query(
    `
      SELECT
        ${USER_COLUMNS}
      FROM users
      WHERE username = $1
    `,
    [username],
  );

  return result.rows[0] ?? null;
}

/* ====================================
          BUSCAR USUARIO POR EMAIL
==================================== */
export async function findUserByEmail(email) {
  const result = await pool.query(
    `
      SELECT
        ${USER_COLUMNS}
      FROM users
      WHERE email = $1
    `,
    [email],
  );

  return result.rows[0] ?? null;
}

/* ====================================
       BUSCAR USUARIO PARA LOGIN
==================================== */
export async function findUserForAuthentication(email) {
  const result = await pool.query(
    `
      SELECT
        id,
        username,
        email,
        password,
        created_at,
        updated_at
      FROM users
      WHERE email = $1
    `,
    [email],
  );

  return result.rows[0] ?? null;
}

/* ====================================
             CREAR USUARIO
==================================== */
export async function createUser({ username, email, password }) {
  const result = await pool.query(
    `
      INSERT INTO users (
        username,
        email,
        password
      )
      VALUES ($1, $2, $3)
      RETURNING
        ${USER_COLUMNS}
    `,
    [username, email, password],
  );

  return result.rows[0];
}

/* ====================================
             LISTAR USUARIOS
==================================== */
export async function findUsers({ search, limit, offset, sortBy, sortOrder }) {
  const values = [];
  const conditions = [];

  if (search) {
    values.push(`%${search}%`);

    conditions.push(`
      (
        username ILIKE $${values.length}
        OR email ILIKE $${values.length}
      )
    `);
  }

  values.push(limit);
  const limitParameter = values.length;

  values.push(offset);
  const offsetParameter = values.length;

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const sortColumn = USER_SORT_COLUMNS[sortBy];

  const result = await pool.query(
    `
      SELECT
        ${USER_COLUMNS}
      FROM users
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
          CONTAR USUARIOS
==================================== */
export async function countUsers({ search }) {
  const values = [];
  const conditions = [];

  if (search) {
    values.push(`%${search}%`);

    conditions.push(`
      (
        username ILIKE $${values.length}
        OR email ILIKE $${values.length}
      )
    `);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await pool.query(
    `
      SELECT COUNT(*) AS total
      FROM users
      ${whereClause}
    `,
    values,
  );

  return Number(result.rows[0].total);
}
/* ====================================
          ACTUALIZAR USUARIO
==================================== */
export async function updateUser(id, { username, email, password }) {
  const fields = [];
  const values = [];

  if (username !== undefined) {
    values.push(username);
    fields.push(`username = $${values.length}`);
  }

  if (email !== undefined) {
    values.push(email);
    fields.push(`email = $${values.length}`);
  }

  if (password !== undefined) {
    values.push(password);
    fields.push(`password = $${values.length}`);
  }

  values.push(id);

  const idParameter = values.length;

  const result = await pool.query(
    `
      UPDATE users
      SET
        ${fields.join(", ")},
        updated_at = NOW()
      WHERE id = $${idParameter}
      RETURNING
        ${USER_COLUMNS}
    `,
    values,
  );

  return result.rows[0] ?? null;
}

/* ====================================
             ELIMINAR USUARIO
==================================== */
export async function deleteUser(id) {
  const result = await pool.query(
    `
      DELETE FROM users
      WHERE id = $1
      RETURNING
        ${USER_COLUMNS}
    `,
    [id],
  );

  return result.rows[0] ?? null;
}
