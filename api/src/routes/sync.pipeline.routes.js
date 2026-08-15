import express from "express";

import { runSyncPipelineController } from "../controllers/sync.pipeline.controller.js";
import { importGradedCardPricesController } from "../controllers/graded-card-prices-import.controller.js";

import { authenticate } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { syncRateLimiter } from "../middlewares/rate-limit.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { validateResponse } from "../middlewares/validate-response.middleware.js";
import {
  gradedCardPricesImportResponseSchema,
  importGradedCardPricesSchema,
} from "../schemas/graded-card-prices.schema.js";
import { syncPipelineResponseSchema } from "../schemas/sync.schema.js";

const router = express.Router();

/* ====================================
        EJECUTAR SYNC PIPELINE
==================================== */

router.post(
  "/",
  authenticate,
  requireRole("admin"),
  syncRateLimiter,
  validateResponse(syncPipelineResponseSchema),
  runSyncPipelineController,
);

router.post(
  "/graded-prices",
  authenticate,
  requireRole("admin"),
  syncRateLimiter,
  validate(importGradedCardPricesSchema, "body"),
  validateResponse(gradedCardPricesImportResponseSchema),
  importGradedCardPricesController,
);

export default router;
