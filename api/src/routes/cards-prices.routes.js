import { Router } from "express";

import {
  getCardPricesController,
  getLatestCardPriceController,
  createCardPriceController,
  getCardPriceStatisticsController,
  getCardPriceVariationController,
  getCardPriceAggregationsController,
} from "../controllers/cards-prices.controller.js";

import { syncPokemonCardPricesController } from "../controllers/cards-prices-sync.controller.js";

import { authenticate } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

import { validate } from "../middlewares/validate.middleware.js";

import { validateResponse } from "../middlewares/validate-response.middleware.js";

import {
  cardPriceCardIdParamsSchema,
  getCardPricesQuerySchema,
  getLatestCardPriceQuerySchema,
  createCardPriceSchema,
  getCardPriceAggregationsQuerySchema,
  cardPricesListResponseSchema,
  latestCardPriceResponseSchema,
  cardPriceStatisticsResponseSchema,
  cardPriceVariationResponseSchema,
  cardPriceAggregationsResponseSchema,
} from "../schemas/cards-prices.schema.js";
import { pokemonCardPricesSyncResponseSchema } from "../schemas/sync.schema.js";

import {
  gradedCardPriceCardIdParamsSchema,
  getGradedCardPricesQuerySchema,
  createGradedCardPriceSchema,
  getLatestGradedCardPriceQuerySchema,
  getGradedCardPriceAggregationsQuerySchema,
  gradedCardPricesListResponseSchema,
  latestGradedCardPriceResponseSchema,
  gradedCardPriceStatisticsResponseSchema,
  gradedCardPriceVariationResponseSchema,
  gradedCardPriceAggregationsResponseSchema,
} from "../schemas/graded-card-prices.schema.js";

import {
  createGradedCardPriceController,
  getGradedCardPricesController,
  getLatestGradedCardPriceController,
  getGradedCardPriceStatisticsController,
  getGradedCardPriceVariationController,
  getGradedCardPriceAggregationsController,
} from "../controllers/graded-card-prices.controller.js";

const router = Router();

/* ====================================
      LISTAR PRECIOS GRADED
==================================== */

router.get(
  "/cards/:cardId/graded-prices",
  authenticate,
  validate(gradedCardPriceCardIdParamsSchema, "params"),
  validate(getGradedCardPricesQuerySchema, "query"),
  validateResponse(gradedCardPricesListResponseSchema),
  getGradedCardPricesController,
);

router.get(
  "/cards/:cardId/graded-prices/latest",
  authenticate,
  validate(gradedCardPriceCardIdParamsSchema, "params"),
  validate(getLatestGradedCardPriceQuerySchema, "query"),
  validateResponse(latestGradedCardPriceResponseSchema),
  getLatestGradedCardPriceController,
);

router.get(
  "/cards/:cardId/graded-prices/stats",
  authenticate,
  validate(gradedCardPriceCardIdParamsSchema, "params"),
  validate(getLatestGradedCardPriceQuerySchema, "query"),
  validateResponse(gradedCardPriceStatisticsResponseSchema),
  getGradedCardPriceStatisticsController,
);

router.get(
  "/cards/:cardId/graded-prices/variation",
  authenticate,
  validate(gradedCardPriceCardIdParamsSchema, "params"),
  validate(getLatestGradedCardPriceQuerySchema, "query"),
  validateResponse(gradedCardPriceVariationResponseSchema),
  getGradedCardPriceVariationController,
);

router.get(
  "/cards/:cardId/graded-prices/aggregations",
  authenticate,
  validate(gradedCardPriceCardIdParamsSchema, "params"),
  validate(getGradedCardPriceAggregationsQuerySchema, "query"),
  validateResponse(gradedCardPriceAggregationsResponseSchema),
  getGradedCardPriceAggregationsController,
);

router.post(
  "/cards/:cardId/graded-prices",
  authenticate,
  validate(gradedCardPriceCardIdParamsSchema, "params"),
  validate(createGradedCardPriceSchema, "body"),
  validateResponse(latestGradedCardPriceResponseSchema),
  createGradedCardPriceController,
);

/* ====================================
        LISTAR HISTÓRICO DE PRECIOS
==================================== */

router.get(
  "/cards/:cardId/prices",
  authenticate,
  validate(cardPriceCardIdParamsSchema, "params"),
  validate(getCardPricesQuerySchema, "query"),
  validateResponse(cardPricesListResponseSchema),
  getCardPricesController,
);

/* ====================================
        OBTENER ÚLTIMO PRECIO
==================================== */

router.get(
  "/cards/:cardId/prices/latest",
  authenticate,
  validate(cardPriceCardIdParamsSchema, "params"),
  validate(getLatestCardPriceQuerySchema, "query"),
  validateResponse(latestCardPriceResponseSchema),
  getLatestCardPriceController,
);

/* ====================================
        ESTADÍSTICAS CARD PRICES
==================================== */

router.get(
  "/cards/:cardId/prices/stats",
  authenticate,
  validate(cardPriceCardIdParamsSchema, "params"),
  validate(getLatestCardPriceQuerySchema, "query"),
  validateResponse(cardPriceStatisticsResponseSchema),
  getCardPriceStatisticsController,
);

/* ====================================
        VARIACIÓN CARD PRICE
==================================== */

router.get(
  "/cards/:cardId/prices/variation",
  authenticate,
  validate(cardPriceCardIdParamsSchema, "params"),
  validate(getLatestCardPriceQuerySchema, "query"),
  validateResponse(cardPriceVariationResponseSchema),
  getCardPriceVariationController,
);

/* ====================================
        AGREGACIONES CARD PRICE
==================================== */

router.get(
  "/cards/:cardId/prices/aggregations",
  authenticate,
  validate(cardPriceCardIdParamsSchema, "params"),
  validate(getCardPriceAggregationsQuerySchema, "query"),
  validateResponse(cardPriceAggregationsResponseSchema),
  getCardPriceAggregationsController,
);

/* ====================================
        CREAR PRECIO
==================================== */

router.post(
  "/cards/:cardId/prices",
  authenticate,
  validate(cardPriceCardIdParamsSchema, "params"),
  validate(createCardPriceSchema, "body"),
  validateResponse(latestCardPriceResponseSchema),
  createCardPriceController,
);

/* ==================================== SYNC CARD PRICES ==================================== */ router.post(
  "/sync/cards/prices",
  authenticate,
  requireRole("admin"),
  validateResponse(pokemonCardPricesSyncResponseSchema),
  syncPokemonCardPricesController,
);
export default router;
