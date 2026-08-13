import express from "express";

import {
  createUser,
  getUser,
  getUserByEmailController,
  getUsersController,
} from "../controllers/user.controller.js";

import { validate } from "../middlewares/validate.middleware.js";

import {
  createUserSchema,
  userEmailParamsSchema,
  userIdParamsSchema,
  getUsersQuerySchema,
} from "../schemas/user.schema.js";

const router = express.Router();

/* ====================================
            CREAR USUARIO
==================================== */
router.post("/", validate(createUserSchema), createUser);

/* ====================================
             LISTAR USUARIOS
==================================== */
router.get("/", validate(getUsersQuerySchema, "query"), getUsersController);

/* ====================================
OBTENER USUARIO POR EMAIL
==================================== */
router.get(
  "/email/:email",
  validate(userEmailParamsSchema, "params"),
  getUserByEmailController,
);

/* ====================================
          OBTENER USUARIO POR ID
==================================== */
router.get("/:id", validate(userIdParamsSchema, "params"), getUser);

export default router;
