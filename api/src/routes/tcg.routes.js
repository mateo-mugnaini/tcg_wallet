import express from "express";

// CONTROLLERS
import {
  getTcg,
  updateTcg,
  createTcg,
  deleteTcg,
  getTcgsController,
} from "../controllers/tcg.controller.js";

// MIDDLEWARES
import { requireRole } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validateResponse } from "../middlewares/validate-response.middleware.js";

// SCHEMAS
import {
  createTcgSchema,
  updateTcgSchema,
  tcgIdParamsSchema,
  getTcgsQuerySchema,
  tcgResponseSchema,
  tcgsListResponseSchema,
} from "../schemas/tcg.schema.js";

const router = express.Router();

/* ====================================
              CREAR TCG
==================================== */

router.post(
  "/",
  authenticate,
  requireRole("admin"),
  validate(createTcgSchema),
  validateResponse(tcgResponseSchema),
  createTcg,
);

/* ====================================
            LISTAR TCGS
==================================== */

router.get(
  "/",
  authenticate,
  validate(getTcgsQuerySchema, "query"),
  validateResponse(tcgsListResponseSchema),
  getTcgsController,
);

/* ====================================
          OBTENER TCG POR ID
==================================== */

router.get(
  "/:id",
  authenticate,
  validate(tcgIdParamsSchema, "params"),
  validateResponse(tcgResponseSchema),
  getTcg,
);

/* ====================================
            ACTUALIZAR TCG
==================================== */

router.patch(
  "/:id",
  authenticate,
  requireRole("admin"),
  validate(tcgIdParamsSchema, "params"),
  validate(updateTcgSchema),
  validateResponse(tcgResponseSchema),
  updateTcg,
);

/* ====================================
             ELIMINAR TCG
==================================== */

router.delete(
  "/:id",
  authenticate,
  requireRole("admin"),
  validate(tcgIdParamsSchema, "params"),
  validateResponse(tcgResponseSchema),
  deleteTcg,
);

export default router;
