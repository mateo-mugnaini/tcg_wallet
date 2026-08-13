import express from "express";

import {
  getUser,
  updateUser,
  createUser,
  deleteUser,
  getUsersController,
  getUserByEmailController,
} from "../controllers/user.controller.js";

import { validate } from "../middlewares/validate.middleware.js";

import {
  createUserSchema,
  updateUserSchema,
  userIdParamsSchema,
  getUsersQuerySchema,
  userEmailParamsSchema,
} from "../schemas/user.schema.js";

import { authenticate } from "../middlewares/auth.middleware.js";
import { requireUserOwnership } from "../middlewares/ownership.middleware.js";

const router = express.Router();

/* ====================================
            CREAR USUARIO
==================================== */

router.post("/", validate(createUserSchema), createUser);

/* ====================================
             LISTAR USUARIOS
==================================== */

router.get(
  "/",
  authenticate,
  validate(getUsersQuerySchema, "query"),
  getUsersController,
);

/* ====================================
      OBTENER USUARIO POR EMAIL
==================================== */

router.get(
  "/email/:email",
  authenticate,
  validate(userEmailParamsSchema, "params"),
  getUserByEmailController,
);

/* ====================================
          OBTENER USUARIO POR ID
==================================== */

router.get(
  "/:id",
  authenticate,
  validate(userIdParamsSchema, "params"),
  requireUserOwnership,
  getUser,
);

/* ====================================
          ACTUALIZAR USUARIO
==================================== */

router.patch(
  "/:id",
  authenticate,
  validate(userIdParamsSchema, "params"),
  validate(updateUserSchema),
  requireUserOwnership,
  updateUser,
);

/* ====================================
             ELIMINAR USUARIO
==================================== */

router.delete(
  "/:id",
  authenticate,
  validate(userIdParamsSchema, "params"),
  requireUserOwnership,
  deleteUser,
);

export default router;
