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

/* ====================================
       ROTAR REFRESH TOKEN
==================================== */
export async function rotateRefreshToken({
  tokenHash,
  userId,
  newTokenHash,
  expiresAt,
}) {
  const client = await pool.connect();
  let transactionStarted = false;

  try {
    await client.query("BEGIN");
    transactionStarted = true;

    /*
     * El token se busca y bloquea dentro de la misma transacción que hará
     * la rotación. Dos solicitudes concurrentes no pueden rotar el mismo
     * registro activo simultáneamente.
     */
    const storedResult = await client.query(
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
        FOR UPDATE
      `,
      [tokenHash],
    );

    const storedToken = storedResult.rows[0] ?? null;

    if (!storedToken) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return { status: "not_found" };
    }

    if (storedToken.user_id !== userId) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return { status: "invalid_user" };
    }

    /*
     * Un refresh token ya revocado indica reutilización. La familia se
     * revoca dentro de esta transacción para que la detección y la respuesta
     * de seguridad sean atómicas.
     */
    if (storedToken.revoked_at) {
      await client.query(
        `
          UPDATE refresh_tokens
          SET
            revoked_at = NOW(),
            updated_at = NOW()
          WHERE token_family_id = $1
            AND revoked_at IS NULL
        `,
        [storedToken.token_family_id],
      );

      await client.query("COMMIT");
      transactionStarted = false;

      return { status: "reused" };
    }

    if (new Date(storedToken.expires_at) <= new Date()) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return { status: "expired" };
    }

    const revokeResult = await client.query(
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
      [storedToken.id],
    );

    if (revokeResult.rows.length === 0) {
      throw new Error("Refresh token ya revocado");
    }

    /*
     * 2. Crear el nuevo refresh token
     *
     * El nuevo token pertenece a la misma
     * familia que el token anterior.
     */
    const createResult = await client.query(
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
      [userId, newTokenHash, expiresAt, storedToken.token_family_id],
    );

    /*
     * 3. Confirmar ambas operaciones
     */
    await client.query("COMMIT");
    transactionStarted = false;

    return {
      status: "rotated",
      revokedToken: revokeResult.rows[0],
      newToken: createResult.rows[0],
    };
  } catch (error) {
    /*
     * Si algo falla, ninguna de las operaciones
     * anteriores queda aplicada.
     */
    if (transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // Conservamos el error original y liberamos el cliente en finally.
      }
    }

    throw error;
  } finally {
    /*
     * El client vuelve al Pool.
     */
    client.release();
  }
}

/* ====================================
    REVOCAR TOKENS DE UN USUARIO
==================================== */
export async function revokeAllRefreshTokensByUserId(userId) {
  const result = await pool.query(
    `
      UPDATE refresh_tokens
      SET
        revoked_at = NOW(),
        updated_at = NOW()
      WHERE user_id = $1
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
    [userId],
  );

  return result.rows;
}
