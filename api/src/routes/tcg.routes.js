import express from "express";

// CONTROLLERS
import {
  getTcg,
  updateTcg,
  createTcg,
  deleteTcg,
  getTcgsController,
} from "../controllers/tcg.controller.js";

// MIDDLEWARES
import { requireRole } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { authenticate } from "../middlewares/auth.middleware.js";

// SCHEMAS
import {
  createTcgSchema,
  updateTcgSchema,
  tcgIdParamsSchema,
  getTcgQuerySchema,
} from "../schemas/tcg.schema.js";

const router = express.Router();

/* ====================================
              CREAR TCG
==================================== */

router.post(
  "/",
  authenticate,
  requireRole("admin"),
  validate(createTcgSchema),
  createTcg,
);

/* ====================================
             LISTAR TCGS
==================================== */

router.get(
  "/",
  authenticate,
  validate(getTcgQuerySchema, "query"),
  getTcgsController,
);

/* ====================================
          OBTENER TCG POR ID
==================================== */

router.get("/:id", authenticate, validate(tcgIdParamsSchema, "params"), getTcg);

/* ====================================
            ACTUALIZAR TCG
==================================== */

router.patch(
  "/:id",
  authenticate,
  requireRole("admin"),
  validate(tcgIdParamsSchema, "params"),
  validate(updateTcgSchema),
  updateTcg,
);

/* ====================================
             ELIMINAR TCG
==================================== */

router.delete(
  "/:id",
  authenticate,
  requireRole("admin"),
  validate(tcgIdParamsSchema, "params"),
  deleteTcg,
);

export default router;
