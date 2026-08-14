import { Router } from "express";

import {
  getCardPricesController,
  getLatestCardPriceController,
  createCardPriceController,
} from "../controllers/cards-prices.controller.js";

import { syncPokemonCardPricesController } from "../controllers/cards-prices-sync.controller.js";

import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

/* ====================================
        LISTAR HISTÓRICO DE PRECIOS
==================================== */

router.get("/cards/:cardId/prices", authenticate, getCardPricesController);

/* ====================================
        OBTENER ÚLTIMO PRECIO
==================================== */

router.get(
  "/cards/:cardId/prices/latest",
  authenticate,
  getLatestCardPriceController,
);

/* ====================================
        CREAR PRECIO
==================================== */

router.post("/cards/:cardId/prices", authenticate, createCardPriceController);

/* ====================================
        SYNC CARD PRICES
==================================== */

router.post(
  "/sync/cards/prices",
  authenticate,
  syncPokemonCardPricesController,
);

export default router;
