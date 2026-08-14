import express from "express";

// CONTROLLERS
import {
  createSet,
  getSet,
  getSetsController,
  updateSet,
  deleteSet,
  syncPokemonSetsController,
} from "../controllers/sets.controller.js";

// MIDDLEWARES
import { requireRole } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { authenticate } from "../middlewares/auth.middleware.js";

// SCHEMAS
import {
  createSetSchema,
  updateSetSchema,
  setIdParamsSchema,
  getSetsQuerySchema,
} from "../schemas/set.schema.js";

const router = express.Router();

/* ====================================
              CREAR SET
==================================== */

router.post(
  "/",
  authenticate,
  requireRole("admin"),
  validate(createSetSchema),
  createSet,
);

/* ====================================
        SINCRONIZAR POKÉMON SETS
==================================== */

router.post(
  "/sync/pokemon",
  authenticate,
  requireRole("admin"),
  syncPokemonSetsController,
);

/* ====================================
            LISTAR SETS
==================================== */

router.get(
  "/",
  authenticate,
  validate(getSetsQuerySchema, "query"),
  getSetsController,
);

/* ====================================
          OBTENER SET POR ID
==================================== */

router.get("/:id", authenticate, validate(setIdParamsSchema, "params"), getSet);

/* ====================================
            ACTUALIZAR SET
==================================== */

router.patch(
  "/:id",
  authenticate,
  requireRole("admin"),
  validate(setIdParamsSchema, "params"),
  validate(updateSetSchema),
  updateSet,
);

/* ====================================
             ELIMINAR SET
==================================== */

router.delete(
  "/:id",
  authenticate,
  requireRole("admin"),
  validate(setIdParamsSchema, "params"),
  deleteSet,
);

export default router;
