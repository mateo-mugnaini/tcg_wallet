import jwt from "jsonwebtoken";

import env from "../config/env.js";

/* ====================================
          GENERAR ACCESS TOKEN
==================================== */
export function generateAccessToken(userId, role) {
  return jwt.sign(
    {
      sub: userId,
      role,
    },
    env.jwt.accessSecret,
    {
      expiresIn: env.jwt.accessExpiresIn,
    },
  );
}

/* ====================================
         GENERAR REFRESH TOKEN
==================================== */
export function generateRefreshToken(userId) {
  return jwt.sign(
    {
      sub: userId,
    },
    env.jwt.refreshSecret,
    {
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
  return jwt.verify(token, env.jwt.refreshSecret);
}

/* ====================================
        VERIFICAR ACCESS TOKEN
==================================== */
export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.accessSecret);
}
