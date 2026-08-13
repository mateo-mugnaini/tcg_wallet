import bcrypt from "bcrypt";

import { findUserForAuthentication } from "../repositories/user.repository.js";

import { createRefreshToken } from "../repositories/refresh-token.repository.js";

import { createAppError } from "../errors/app.errors.js";

import {
  generateAccessToken,
  generateRefreshToken,
  getTokenExpiration,
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
