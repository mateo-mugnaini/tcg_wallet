import { Router } from "express";

import {
  getCollectionItemsController,
  getCollectionItemByIdController,
  createCollectionItemController,
  updateCollectionItemController,
  deleteCollectionItemController,
} from "../controllers/collection-items.controller.js";

import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

/* ====================================
          LISTAR COLECCIÓN
==================================== */

router.get("/", authenticate, getCollectionItemsController);

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
