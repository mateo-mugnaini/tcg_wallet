import express from "express";

import { login, refresh, logout } from "../controllers/auth.controller.js";

import { validate } from "../middlewares/validate.middleware.js";

import { loginSchema } from "../schemas/auth.schema.js";

import {
  loginRateLimiter,
  refreshRateLimiter,
} from "../middlewares/rate-limit.middleware.js";

const router = express.Router();

/* ====================================
              INICIAR SESIÓN
==================================== */

router.post("/login", loginRateLimiter, validate(loginSchema), login);

/* ====================================
            REFRESCAR TOKEN
==================================== */

router.post("/refresh", refreshRateLimiter, refresh);

/* ====================================
             CERRAR SESIÓN
==================================== */

router.post("/logout", logout);

export default router;
