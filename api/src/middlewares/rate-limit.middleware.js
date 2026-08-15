import rateLimit from "express-rate-limit";

/* ====================================
        LIMITAR INTENTOS DE LOGIN
==================================== */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,

  standardHeaders: "draft-8",
  legacyHeaders: false,

  message: {
    status: "error",
    message: "Demasiados intentos de login. Intenta nuevamente más tarde.",
  },
});

/* ====================================
      LIMITAR REFRESH TOKEN
==================================== */
export const refreshRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,

  standardHeaders: "draft-8",
  legacyHeaders: false,

  message: {
    status: "error",
    message: "Demasiadas solicitudes de refresh. Intenta nuevamente más tarde.",
  },
});

/* ====================================
       LIMITAR ENDPOINTS DE USUARIOS
==================================== */
export const userRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,

  standardHeaders: "draft-8",
  legacyHeaders: false,

  message: {
    status: "error",
    message:
      "Demasiadas solicitudes de usuarios. Intenta nuevamente más tarde.",
  },
});

/* ====================================
       LIMITAR REGISTRO DE USUARIOS
==================================== */
export const registrationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,

  standardHeaders: "draft-8",
  legacyHeaders: false,

  message: {
    status: "error",
    message: "Demasiados registros. Intenta nuevamente más tarde.",
  },
});

/* ====================================
       LIMITAR SINCRONIZACIONES
==================================== */
export const syncRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 2,

  standardHeaders: "draft-8",
  legacyHeaders: false,

  message: {
    status: "error",
    message: "Demasiadas sincronizaciones. Intenta nuevamente más tarde.",
  },
});
