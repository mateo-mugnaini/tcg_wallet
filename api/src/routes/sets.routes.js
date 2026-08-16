import express from "express";

// CONTROLLERS
import {
  createSet,
  getSet,
  getSetsController,
  updateSet,
  deleteSet,
} from "../controllers/sets.controller.js";
import { createSyncJobTypeController } from "../controllers/sync-jobs.controller.js";

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
import { syncJobResponseSchema } from "../schemas/sync-jobs.schema.js";
import { syncRateLimiter } from "../middlewares/rate-limit.middleware.js";
import { syncExecutionLock } from "../middlewares/sync-lock.middleware.js";

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
  syncRateLimiter,
  syncExecutionLock,
  validateResponse(syncJobResponseSchema),
  createSyncJobTypeController("sets"),
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
