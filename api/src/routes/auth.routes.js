import express from "express";

import { login, refresh } from "../controllers/auth.controller.js";

import { validate } from "../middlewares/validate.middleware.js";

import { loginSchema, refreshTokenSchema } from "../schemas/auth.schema.js";

const router = express.Router();

/* ====================================
              INICIAR SESIÓN
==================================== */
router.post("/login", validate(loginSchema), login);

/* ====================================
            REFRESCAR TOKEN
==================================== */
router.post("/refresh", validate(refreshTokenSchema), refresh);

export default router;
