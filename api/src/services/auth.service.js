import bcrypt from "bcrypt";

import {
  findUserById,
  findUserForAuthentication,
} from "../repositories/user.repository.js";

import {
  createRefreshToken,
  revokeRefreshToken,
  rotateRefreshToken,
  findRefreshTokenByHash,
  revokeRefreshTokenFamily,
} from "../repositories/refresh-token.repository.js";

import { createAppError } from "../errors/app.errors.js";

import {
  getTokenExpiration,
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken,
} from "../utils/jwt.js";

import { hashToken, generateTokenFamilyId } from "../utils/token.js";

/* ====================================
              INICIAR SESIÓN
==================================== */
export async function loginUser({ email, password }) {
  const user = await findUserForAuthentication(email);

  if (!user) {
    throw createAppError("Credenciales inválidas", 401);
  }

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    throw createAppError("Credenciales inválidas", 401);
  }

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);

  const tokenHash = hashToken(refreshToken);
  const expiresAt = getTokenExpiration(refreshToken);

  /*
   * Una nueva sesión genera una nueva familia.
   */
  const tokenFamilyId = generateTokenFamilyId();

  await createRefreshToken({
    userId: user.id,
    tokenHash,
    expiresAt,
    tokenFamilyId,
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
    },
  };
}

/* ====================================
            REFRESCAR SESIÓN
==================================== */
export async function refreshUserToken(refreshToken) {
  const tokenHash = hashToken(refreshToken);

  const storedToken = await findRefreshTokenByHash(tokenHash);

  if (!storedToken) {
    throw createAppError("Refresh token inválido", 401);
  }

  /*
   * Si el token ya fue revocado y alguien intenta
   * reutilizarlo, consideramos comprometida toda
   * la familia de tokens.
   */
  if (storedToken.revoked_at) {
    await revokeRefreshTokenFamily(storedToken.token_family_id);

    throw createAppError(
      "Refresh token reutilizado. Sesión revocada por seguridad",
      401,
    );
  }

  if (new Date(storedToken.expires_at) <= new Date()) {
    throw createAppError("Refresh token expirado", 401);
  }

  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw createAppError("Refresh token inválido", 401);
  }

  if (payload.sub !== storedToken.user_id) {
    throw createAppError("Refresh token inválido", 401);
  }

  /*
   * ROTACIÓN DEL REFRESH TOKEN
   *
   * El token actual se revoca.
   */

  const user = await findUserById(storedToken.user_id);

  if (!user) {
    throw createAppError("Usuario no encontrado", 401);
  }

  const accessToken = generateAccessToken(user.id, user.role);

  const newRefreshToken = generateRefreshToken(storedToken.user_id);

  const newTokenHash = hashToken(newRefreshToken);

  const expiresAt = getTokenExpiration(newRefreshToken);

  await rotateRefreshToken({
    currentTokenId: storedToken.id,
    userId: storedToken.user_id,
    tokenHash: newTokenHash,
    expiresAt,
    tokenFamilyId: storedToken.token_family_id,
  });
  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
}

/* ====================================
              CERRAR SESIÓN
==================================== */
export async function logoutUser(refreshToken) {
  const tokenHash = hashToken(refreshToken);

  const storedToken = await findRefreshTokenByHash(tokenHash);

  if (!storedToken) {
    throw createAppError("Refresh token inválido", 401);
  }

  if (storedToken.revoked_at) {
    throw createAppError("Refresh token ya revocado", 401);
  }

  const revokedToken = await revokeRefreshToken(storedToken.id);

  if (!revokedToken) {
    throw createAppError("No se pudo cerrar la sesión", 500);
  }

  return {
    message: "Sesión cerrada correctamente",
  };
}
