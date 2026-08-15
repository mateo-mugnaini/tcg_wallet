import env from "./env.js";

/* ====================================
          CONFIGURACIÓN CORS
==================================== */

const corsOrigin =
  env.nodeEnv === "production" ? env.cors.production : env.cors.dev;

export const corsOptions = {
  origin: corsOrigin,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 204,
};

/* ====================================
          CONFIGURACIÓN HELMET
==================================== */

export const helmetOptions = {
  contentSecurityPolicy: false,
};

/* ====================================
      CONFIGURACIÓN REFRESH TOKEN
==================================== */

export const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === "production",
  sameSite: env.nodeEnv === "production" ? "strict" : "lax",
  path: "/api/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
