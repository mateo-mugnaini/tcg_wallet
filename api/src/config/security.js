import env from "./env.js";

/* ====================================
          CONFIGURACIÓN CORS
==================================== */

const isProductionLike = ["staging", "production"].includes(env.nodeEnv);
const corsOrigin = isProductionLike ? env.cors.production : env.cors.dev;
const allowedCorsOrigins = isProductionLike
  ? new Set([corsOrigin])
  : new Set([corsOrigin, "http://localhost:5173", "http://127.0.0.1:5173"]);

export const corsOptions = {
  origin(origin, callback) {
    // Requests without an Origin header are allowed for health checks and CLI clients.
    if (!origin || allowedCorsOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
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
  secure: isProductionLike,
  sameSite: isProductionLike ? env.refreshCookie.sameSite : "lax",
  ...(env.refreshCookie.domain ? { domain: env.refreshCookie.domain } : {}),
  path: "/api/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
