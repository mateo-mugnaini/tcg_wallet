import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { z } from "zod";

import env from "../config/env.js";
import { ALLOWED_ROLES } from "../constants/roles.js";
import { createAppError } from "../errors/app.errors.js";

export const JWT_ALGORITHM = "HS256";

const accessTokenPayloadSchema = z.object({
  sub: z.string().uuid(),
  role: z.enum(ALLOWED_ROLES),
});

const refreshTokenPayloadSchema = z.object({
  sub: z.string().uuid(),
  jti: z.string().uuid(),
});

function isJwtVerificationError(error) {
  return ["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(
    error?.name,
  );
}

function verifyAndValidateToken(token, secret, schema, errorMessage) {
  try {
    const payload = jwt.verify(token, secret, {
      algorithms: [JWT_ALGORITHM],
    });

    const parsedPayload = schema.safeParse(payload);

    if (!parsedPayload.success) {
      throw createAppError(errorMessage, 401, "INVALID_TOKEN");
    }

    return parsedPayload.data;
  } catch (error) {
    if (error.statusCode === 401 || isJwtVerificationError(error)) {
      if (error.statusCode === 401) {
        throw error;
      }

      throw createAppError(errorMessage, 401, "INVALID_TOKEN");
    }

    throw error;
  }
}

/* ====================================
          GENERAR ACCESS TOKEN
==================================== */
export function generateAccessToken(userId, role) {
  const payload = accessTokenPayloadSchema.parse({
    sub: userId,
    role,
  });

  return jwt.sign(
    payload,
    env.jwt.accessSecret,
    {
      algorithm: JWT_ALGORITHM,
      expiresIn: env.jwt.accessExpiresIn,
    },
  );
}

/* ====================================
         GENERAR REFRESH TOKEN
==================================== */
export function generateRefreshToken(userId) {
  const payload = refreshTokenPayloadSchema.parse({
    sub: userId,
    jti: randomUUID(),
  });

  return jwt.sign(
    payload,
    env.jwt.refreshSecret,
    {
      algorithm: JWT_ALGORITHM,
      expiresIn: env.jwt.refreshExpiresIn,
    },
  );
}

/* ====================================
       OBTENER EXPIRACIÓN DEL TOKEN
==================================== */
export function getTokenExpiration(token) {
  const decoded = jwt.decode(token);

  if (!decoded || !decoded.exp) {
    throw new Error("Token JWT inválido");
  }

  return new Date(decoded.exp * 1000);
}

/* ====================================
        VERIFICAR REFRESH TOKEN
==================================== */
export function verifyRefreshToken(token) {
  return verifyAndValidateToken(
    token,
    env.jwt.refreshSecret,
    refreshTokenPayloadSchema,
    "Refresh token inválido o expirado",
  );
}

/* ====================================
        VERIFICAR ACCESS TOKEN
==================================== */
export function verifyAccessToken(token) {
  return verifyAndValidateToken(
    token,
    env.jwt.accessSecret,
    accessTokenPayloadSchema,
    "Token de autenticación inválido o expirado",
  );
}
