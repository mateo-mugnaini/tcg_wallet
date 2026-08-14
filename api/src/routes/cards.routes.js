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

const router = Router();

/* ====================================
              LISTAR CARDS
==================================== */

router.get("/", authenticate, getCardsController);

/* ====================================
          OBTENER CARD POR ID
==================================== */

router.get("/:id", authenticate, getCardByIdController);

/* ====================================
              CREAR CARD
==================================== */

router.post("/", authenticate, createCardController);

/* ====================================
           ACTUALIZAR CARD
==================================== */

router.put("/:id", authenticate, updateCardController);

/* ====================================
            ELIMINAR CARD
==================================== */

router.delete("/:id", authenticate, deleteCardController);

/* ====================================
        SINCRONIZAR POKÉMON
==================================== */

router.post("/sync/pokemon", authenticate, syncPokemonCardsController);

export default router;
