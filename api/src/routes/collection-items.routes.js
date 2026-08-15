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

import {
  collectionItemIdParamsSchema,
  collectionItemDataResponseSchema,
  collectionItemMutationResponseSchema,
  collectionItemsListResponseSchema,
  collectionStatsResponseSchema,
  collectionValueResponseSchema,
  createCollectionItemSchema,
  getCollectionItemsQuerySchema,
  updateCollectionItemSchema,
} from "../schemas/collection-items.schema.js";

import { validate } from "../middlewares/validate.middleware.js";

const router = Router();

/* ====================================
          LISTAR COLECCIÓN
==================================== */

router.get(
  "/",
  authenticate,
  validate(getCollectionItemsQuerySchema, "query"),
  validateResponse(collectionItemsListResponseSchema),
  getCollectionItemsController,
);

/* ====================================
      ESTADÍSTICAS DE COLECCIÓN
==================================== */

router.get(
  "/stats",
  authenticate,
  validateResponse(collectionStatsResponseSchema),
  getCollectionStatsController,
);

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

router.get(
  "/:id",
  authenticate,
  validate(collectionItemIdParamsSchema, "params"),
  validateResponse(collectionItemDataResponseSchema),
  getCollectionItemByIdController,
);

/* ====================================
        AGREGAR A COLECCIÓN
==================================== */

router.post(
  "/",
  authenticate,
  validate(createCollectionItemSchema, "body"),
  validateResponse(collectionItemMutationResponseSchema),
  createCollectionItemController,
);

/* ====================================
        ACTUALIZAR COLECCIÓN
==================================== */

router.put(
  "/:id",
  authenticate,
  validate(collectionItemIdParamsSchema, "params"),
  validate(updateCollectionItemSchema, "body"),
  validateResponse(collectionItemMutationResponseSchema),
  updateCollectionItemController,
);

/* ====================================
        ELIMINAR DE COLECCIÓN
==================================== */

router.delete(
  "/:id",
  authenticate,
  validate(collectionItemIdParamsSchema, "params"),
  validateResponse(collectionItemMutationResponseSchema),
  deleteCollectionItemController,
);

export default router;
