import pool from "../config/database.js";

/* ====================================
        LISTAR GRADING COMPANIES
==================================== */

export async function findGradingCompanies() {
  const query = `
    SELECT
      id,
      name,
      created_at
    FROM grading_companies
    ORDER BY name ASC
  `;

  const result = await pool.query(query);

  return result.rows;
}

/* ====================================
      BUSCAR GRADING COMPANY POR ID
==================================== */

export async function findGradingCompanyById(id) {
  const query = `
    SELECT
      id,
      name,
      created_at
    FROM grading_companies
    WHERE id = $1
  `;

  const result = await pool.query(query, [id]);

  return result.rows[0] ?? null;
}

/* ====================================
      BUSCAR GRADING COMPANY POR NOMBRE
==================================== */

export async function findGradingCompanyByName(name) {
  const query = `
    SELECT
      id,
      name,
      created_at
    FROM grading_companies
    WHERE name = $1
  `;

  const result = await pool.query(query, [name]);

  return result.rows[0] ?? null;
}

/* ====================================
        CREAR GRADING COMPANY
==================================== */

export async function createGradingCompany({ name }) {
  const query = `
    INSERT INTO grading_companies (
      name
    )
    VALUES ($1)
    RETURNING
      id,
      name,
      created_at
  `;

  const result = await pool.query(query, [name]);

  return result.rows[0];
}

/* ====================================
      ELIMINAR GRADING COMPANY
==================================== */

export async function deleteGradingCompany(id) {
  const query = `
    DELETE FROM grading_companies
    WHERE id = $1
    RETURNING
      id,
      name,
      created_at
  `;

  const result = await pool.query(query, [id]);

  return result.rows[0] ?? null;
}
