import express from "express";

import { login } from "../controllers/auth.controller.js";

import { validate } from "../middlewares/validate.middleware.js";

import { loginSchema } from "../schemas/auth.schema.js";

const router = express.Router();

/* ====================================
              INICIAR SESIÓN
==================================== */
router.post("/login", validate(loginSchema), login);

export default router;
