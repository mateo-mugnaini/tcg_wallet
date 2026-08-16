import { Router } from "express";

import {
  getCardsController,
  getCardByIdController,
  createCardController,
  updateCardController,
  deleteCardController,
} from "../controllers/cards.controller.js";
import { createSyncJobTypeController } from "../controllers/sync-jobs.controller.js";

import { authenticate } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { syncRateLimiter } from "../middlewares/rate-limit.middleware.js";
import { syncExecutionLock } from "../middlewares/sync-lock.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { validateResponse } from "../middlewares/validate-response.middleware.js";

import {
  cardIdParamsSchema,
  cardDataResponseSchema,
  cardDetailDataResponseSchema,
  cardsListResponseSchema,
  createCardSchema,
  getCardsQuerySchema,
  updateCardSchema,
} from "../schemas/cards.schema.js";
import { syncJobResponseSchema } from "../schemas/sync-jobs.schema.js";

const router = Router();

/* ====================================
              LISTAR CARDS
==================================== */

router.get(
  "/",
  authenticate,
  validate(getCardsQuerySchema, "query"),
  validateResponse(cardsListResponseSchema),
  getCardsController,
);

/* ====================================
          OBTENER CARD POR ID
==================================== */

router.get(
  "/:id",
  authenticate,
  validate(cardIdParamsSchema, "params"),
  validateResponse(cardDetailDataResponseSchema),
  getCardByIdController,
);

/* ====================================
              CREAR CARD
==================================== */

router.post(
  "/",
  authenticate,
  requireRole("admin"),
  validate(createCardSchema, "body"),
  validateResponse(cardDataResponseSchema),
  createCardController,
);

/* ====================================
           ACTUALIZAR CARD
==================================== */

router.put(
  "/:id",
  authenticate,
  requireRole("admin"),
  validate(cardIdParamsSchema, "params"),
  validate(updateCardSchema, "body"),
  validateResponse(cardDataResponseSchema),
  updateCardController,
);

/* ====================================
            ELIMINAR CARD
==================================== */

router.delete(
  "/:id",
  authenticate,
  requireRole("admin"),
  validate(cardIdParamsSchema, "params"),
  validateResponse(cardDataResponseSchema),
  deleteCardController,
);

/* ====================================
        SINCRONIZAR POKÉMON
==================================== */

router.post(
  "/sync/pokemon",
  authenticate,
  requireRole("admin"),
  syncRateLimiter,
  syncExecutionLock,
  validateResponse(syncJobResponseSchema),
  createSyncJobTypeController("cards"),
);

export default router;
