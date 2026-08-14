import express from "express";

//* CONTROLLERS
import {
  getUser,
  updateUser,
  createUser,
  deleteUser,
  getUsersController,
  getUserByEmailController,
} from "../controllers/user.controller.js";

//* MIDDLEWARES
import { requireRole } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { requireOwnershipOrRole } from "../middlewares/authorization.middleware.js";

//* SCHEMAS
import {
  createUserSchema,
  updateUserSchema,
  userIdParamsSchema,
  getUsersQuerySchema,
  userEmailParamsSchema,
} from "../schemas/user.schema.js";

const router = express.Router();
/* ====================================
           * CREAR USUARIO
==================================== */

router.post("/", validate(createUserSchema), createUser);

/* ====================================
           * LISTAR USUARIOS
==================================== */

router.get(
  "/",
  authenticate,
  requireRole("admin"),
  validate(getUsersQuerySchema, "query"),
  getUsersController,
);

/* ====================================
      OBTENER USUARIO POR EMAIL
==================================== */

router.get(
  "/email/:email",
  authenticate,
  requireRole("admin"),
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
  requireOwnershipOrRole("admin"),
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
  requireOwnershipOrRole("admin"),
  updateUser,
);

/* ====================================
             ELIMINAR USUARIO
==================================== */

router.delete(
  "/:id",
  authenticate,
  validate(userIdParamsSchema, "params"),
  requireOwnershipOrRole("admin"),
  deleteUser,
);
export default router;
