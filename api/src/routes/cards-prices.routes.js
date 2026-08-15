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

import { validate } from "../middlewares/validate.middleware.js";

import {
  cardPriceCardIdParamsSchema,
  getCardPricesQuerySchema,
  getLatestCardPriceQuerySchema,
  createCardPriceSchema,
  getCardPriceAggregationsQuerySchema,
} from "../schemas/cards-prices.schema.js";

const router = Router();

/* ====================================
        LISTAR HISTÓRICO DE PRECIOS
==================================== */

router.get(
  "/cards/:cardId/prices",
  authenticate,
  validate(cardPriceCardIdParamsSchema, "params"),
  validate(getCardPricesQuerySchema, "query"),
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
  getCardPriceAggregationsController,
);

/* ====================================
        CREAR PRECIO
==================================== */

router.post(
  "/cards/:cardId/prices",
  authenticate,
  validate(cardPriceCardIdParamsSchema, "params"),
  validate(createCardPriceSchema),
  createCardPriceController,
);

/* ====================================
        SYNC CARD PRICES
==================================== */

router.post(
  "/sync/cards/prices",
  authenticate,
  syncPokemonCardPricesController,
);

export default router;
