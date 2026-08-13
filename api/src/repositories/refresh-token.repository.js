import pool from "../config/database.js";

/* ====================================
        CREAR REFRESH TOKEN
==================================== */
export async function createRefreshToken({
  userId,
  tokenHash,
  expiresAt,
  tokenFamilyId,
}) {
  const result = await pool.query(
    `
      INSERT INTO refresh_tokens (
        user_id,
        token_hash,
        expires_at,
        token_family_id
      )
      VALUES ($1, $2, $3, $4)
      RETURNING
        id,
        user_id,
        token_hash,
        expires_at,
        revoked_at,
        created_at,
        updated_at,
        token_family_id
    `,
    [userId, tokenHash, expiresAt, tokenFamilyId],
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
        updated_at,
        token_family_id
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
        updated_at,
        token_family_id
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

/* ====================================
      REVOCAR FAMILIA DE TOKENS
==================================== */
export async function revokeRefreshTokenFamily(tokenFamilyId) {
  const result = await pool.query(
    `
      UPDATE refresh_tokens
      SET
        revoked_at = NOW(),
        updated_at = NOW()
      WHERE token_family_id = $1
        AND revoked_at IS NULL
      RETURNING
        id,
        user_id,
        token_hash,
        expires_at,
        revoked_at,
        created_at,
        updated_at,
        token_family_id
    `,
    [tokenFamilyId],
  );

  return result.rows;
}
