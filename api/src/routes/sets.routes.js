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
import { validateResponse } from "../middlewares/validate-response.middleware.js";

// SCHEMAS
import {
  createSetSchema,
  updateSetSchema,
  setIdParamsSchema,
  getSetsQuerySchema,
  setResponseSchema,
  setsListResponseSchema,
} from "../schemas/set.schema.js";
import { pokemonSetsSyncResponseSchema } from "../schemas/sync.schema.js";

const router = express.Router();

/* ====================================
              CREAR SET
==================================== */

router.post(
  "/",
  authenticate,
  requireRole("admin"),
  validate(createSetSchema),
  validateResponse(setResponseSchema),
  createSet,
);

/* ====================================
        SINCRONIZAR POKÉMON SETS
==================================== */

router.post(
  "/sync/pokemon",
  authenticate,
  requireRole("admin"),
  validateResponse(pokemonSetsSyncResponseSchema),
  syncPokemonSetsController,
);

/* ====================================
            LISTAR SETS
==================================== */

router.get(
  "/",
  authenticate,
  validate(getSetsQuerySchema, "query"),
  validateResponse(setsListResponseSchema),
  getSetsController,
);

/* ====================================
          OBTENER SET POR ID
==================================== */

router.get(
  "/:id",
  authenticate,
  validate(setIdParamsSchema, "params"),
  validateResponse(setResponseSchema),
  getSet,
);

/* ====================================
            ACTUALIZAR SET
==================================== */

router.patch(
  "/:id",
  authenticate,
  requireRole("admin"),
  validate(setIdParamsSchema, "params"),
  validate(updateSetSchema),
  validateResponse(setResponseSchema),
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
  validateResponse(setResponseSchema),
  deleteSet,
);

export default router;
