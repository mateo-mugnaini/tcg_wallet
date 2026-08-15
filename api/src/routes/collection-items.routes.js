import { Router } from "express";

import {
  getCollectionItemsController,
  getCollectionItemByIdController,
  createCollectionItemController,
  updateCollectionItemController,
  deleteCollectionItemController,
  getCollectionStatsController,
  getCollectionValueController,
} from "../controllers/collection-items.controller.js";

import { authenticate } from "../middlewares/auth.middleware.js";

import { validateResponse } from "../middlewares/validate-response.middleware.js";

import { collectionValueResponseSchema } from "../schemas/collection-items.schema.js";

const router = Router();

/* ====================================
          LISTAR COLECCIÓN
==================================== */

router.get("/", authenticate, getCollectionItemsController);

/* ====================================
      ESTADÍSTICAS DE COLECCIÓN
==================================== */

router.get("/stats", authenticate, getCollectionStatsController);

/* ====================================
      VALOR ESTIMADO DE COLECCIÓN
==================================== */

router.get(
  "/value",
  authenticate,
  validateResponse(collectionValueResponseSchema),
  getCollectionValueController,
);

/* ====================================
        OBTENER ITEM POR ID
==================================== */

router.get("/:id", authenticate, getCollectionItemByIdController);

/* ====================================
        AGREGAR A COLECCIÓN
==================================== */

router.post("/", authenticate, createCollectionItemController);

/* ====================================
        ACTUALIZAR COLECCIÓN
==================================== */

router.put("/:id", authenticate, updateCollectionItemController);

/* ====================================
        ELIMINAR DE COLECCIÓN
==================================== */

router.delete("/:id", authenticate, deleteCollectionItemController);

export default router;
