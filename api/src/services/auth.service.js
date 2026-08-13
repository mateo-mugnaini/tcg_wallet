import bcrypt from "bcrypt";

import { findUserForAuthentication } from "../repositories/user.repository.js";

import {
  createRefreshToken,
  findRefreshTokenByHash,
  revokeRefreshToken,
} from "../repositories/refresh-token.repository.js";

import { createAppError } from "../errors/app.errors.js";

import {
  generateAccessToken,
  generateRefreshToken,
  getTokenExpiration,
  verifyRefreshToken,
} from "../utils/jwt.js";

import { hashToken } from "../utils/token.js";

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

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  const tokenHash = hashToken(refreshToken);
  const expiresAt = getTokenExpiration(refreshToken);

  await createRefreshToken({
    userId: user.id,
    tokenHash,
    expiresAt,
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

  if (storedToken.revoked_at) {
    throw createAppError("Refresh token revocado", 401);
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

  await revokeRefreshToken(storedToken.id);

  const accessToken = generateAccessToken(storedToken.user_id);
  const newRefreshToken = generateRefreshToken(storedToken.user_id);

  const newTokenHash = hashToken(newRefreshToken);
  const expiresAt = getTokenExpiration(newRefreshToken);

  await createRefreshToken({
    userId: storedToken.user_id,
    tokenHash: newTokenHash,
    expiresAt,
  });

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
}
