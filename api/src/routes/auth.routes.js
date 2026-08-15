import express from "express";

import { login, refresh, logout } from "../controllers/auth.controller.js";

import { validate } from "../middlewares/validate.middleware.js";

import { loginSchema } from "../schemas/auth.schema.js";
import {
  loginResponseSchema,
  refreshResponseSchema,
} from "../schemas/auth.schema.js";
import { validateResponse } from "../middlewares/validate-response.middleware.js";

import {
  loginRateLimiter,
  refreshRateLimiter,
} from "../middlewares/rate-limit.middleware.js";

const router = express.Router();

/* ====================================
              INICIAR SESIÓN
==================================== */

router.post(
  "/login",
  loginRateLimiter,
  validate(loginSchema),
  validateResponse(loginResponseSchema),
  login,
);

/* ====================================
            REFRESCAR TOKEN
==================================== */

router.post(
  "/refresh",
  refreshRateLimiter,
  validateResponse(refreshResponseSchema),
  refresh,
);

/* ====================================
             CERRAR SESIÓN
==================================== */

router.post("/logout", logout);

export default router;
