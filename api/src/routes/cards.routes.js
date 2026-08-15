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

import {
  cardIdParamsSchema,
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
  getCardsController,
);

/* ====================================
          OBTENER CARD POR ID
==================================== */

router.get(
  "/:id",
  authenticate,
  validate(cardIdParamsSchema, "params"),
  getCardByIdController,
);

/* ====================================
              CREAR CARD
==================================== */

router.post(
  "/",
  authenticate,
  validate(createCardSchema, "body"),
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
  updateCardController,
);

/* ====================================
            ELIMINAR CARD
==================================== */

router.delete(
  "/:id",
  authenticate,
  validate(cardIdParamsSchema, "params"),
  deleteCardController,
);

/* ====================================
        SINCRONIZAR POKÉMON
==================================== */

router.post("/sync/pokemon", authenticate, syncPokemonCardsController);

export default router;
