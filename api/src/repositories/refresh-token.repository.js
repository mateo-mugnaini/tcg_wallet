import pool from "../config/database.js";

/* ====================================
        CREAR REFRESH TOKEN
==================================== */
export async function createRefreshToken({ userId, tokenHash, expiresAt }) {
  const result = await pool.query(
    `
      INSERT INTO refresh_tokens (
        user_id,
        token_hash,
        expires_at
      )
      VALUES ($1, $2, $3)
      RETURNING
        id,
        user_id,
        token_hash,
        expires_at,
        revoked_at,
        created_at,
        updated_at
    `,
    [userId, tokenHash, expiresAt],
  );

  return result.rows[0];
}

/* ====================================
      BUSCAR REFRESH TOKEN POR HASH
==================================== */
export async function findRefreshTokenByHash(tokenHash) {
  const result = await pool.query(
    `
      SELECT
        id,
        user_id,
        token_hash,
        expires_at,
        revoked_at,
        created_at,
        updated_at
      FROM refresh_tokens
      WHERE token_hash = $1
    `,
    [tokenHash],
  );

  return result.rows[0] ?? null;
}

/* ====================================
        REVOCAR REFRESH TOKEN
==================================== */
export async function revokeRefreshToken(id) {
  const result = await pool.query(
    `
      UPDATE refresh_tokens
      SET
        revoked_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
        AND revoked_at IS NULL
      RETURNING
        id,
        user_id,
        token_hash,
        expires_at,
        revoked_at,
        created_at,
        updated_at
    `,
    [id],
  );

  return result.rows[0] ?? null;
}
