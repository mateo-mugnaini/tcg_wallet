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
} from "../repositories/refresh-token.repository.js";

import { createAppError } from "../errors/app.errors.js";

import {
  getTokenExpiration,
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken,
} from "../utils/jwt.js";

import { hashToken, generateTokenFamilyId } from "../utils/token.js";

/*
 * Hash bcrypt estático con costo 12 para igualar el costo usado al crear
 * contraseñas. Se usa cuando el email no existe y evita cortar el flujo antes
 * de ejecutar bcrypt.compare.
 */
const DUMMY_PASSWORD_HASH =
  "$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

/* ====================================
              INICIAR SESIÓN
==================================== */
export async function loginUser({ email, password }) {
  const user = await findUserForAuthentication(email);

  const passwordMatches = await bcrypt.compare(
    password,
    user?.password ?? DUMMY_PASSWORD_HASH,
  );

  if (!user || !passwordMatches) {
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
  const payload = verifyRefreshToken(refreshToken);
  const tokenHash = hashToken(refreshToken);

  const user = await findUserById(payload.sub);

  if (!user) {
    throw createAppError("Usuario no encontrado", 401);
  }

  const newRefreshToken = generateRefreshToken(payload.sub);

  const newTokenHash = hashToken(newRefreshToken);

  const expiresAt = getTokenExpiration(newRefreshToken);

  const rotation = await rotateRefreshToken({
    tokenHash,
    userId: payload.sub,
    newTokenHash,
    expiresAt,
  });

  if (rotation.status === "not_found") {
    throw createAppError("Refresh token inválido", 401);
  }

  if (rotation.status === "invalid_user") {
    throw createAppError("Refresh token inválido", 401);
  }

  if (rotation.status === "expired") {
    throw createAppError("Refresh token expirado", 401);
  }

  if (rotation.status === "reused") {
    throw createAppError(
      "Refresh token reutilizado. Sesión revocada por seguridad",
      401,
    );
  }

  if (rotation.status !== "rotated") {
    throw new Error("Estado de rotación de refresh token no reconocido");
  }

  const accessToken = generateAccessToken(user.id, user.role);

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
