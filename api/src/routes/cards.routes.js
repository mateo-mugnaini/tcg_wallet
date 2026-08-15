import { Router } from "express";

import {
  getCardsController,
  getCardByIdController,
  createCardController,
  updateCardController,
  deleteCardController,
  syncPokemonCardsController,
} from "../controllers/cards.controller.js";

import { authenticate } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { validateResponse } from "../middlewares/validate-response.middleware.js";

import {
  cardIdParamsSchema,
  cardDataResponseSchema,
  cardsListResponseSchema,
  createCardSchema,
  getCardsQuerySchema,
  updateCardSchema,
} from "../schemas/cards.schema.js";

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
  validateResponse(cardDataResponseSchema),
  getCardByIdController,
);

/* ====================================
              CREAR CARD
==================================== */

router.post(
  "/",
  authenticate,
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
  validate(cardIdParamsSchema, "params"),
  validateResponse(cardDataResponseSchema),
  deleteCardController,
);

/* ====================================
        SINCRONIZAR POKÉMON
==================================== */

router.post("/sync/pokemon", authenticate, syncPokemonCardsController);

export default router;
