import express from "express";

import {
  createSyncJobController,
  createSyncJobTypeController,
  getSyncJobController,
  listSyncJobsController,
} from "../controllers/sync-jobs.controller.js";
import { importGradedCardPricesController } from "../controllers/graded-card-prices-import.controller.js";

import { authenticate } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { syncRateLimiter } from "../middlewares/rate-limit.middleware.js";
import { syncExecutionLock } from "../middlewares/sync-lock.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { validateResponse } from "../middlewares/validate-response.middleware.js";
import {
  gradedCardPricesImportResponseSchema,
  importGradedCardPricesSchema,
} from "../schemas/graded-card-prices.schema.js";
import {
  createSyncJobSchema,
  syncJobIdParamsSchema,
  syncJobResponseSchema,
  syncJobsListResponseSchema,
} from "../schemas/sync-jobs.schema.js";

const router = express.Router();

router.post(
  "/jobs",
  authenticate,
  requireRole("admin"),
  syncRateLimiter,
  validate(createSyncJobSchema, "body"),
  validateResponse(syncJobResponseSchema),
  createSyncJobController,
);

router.get(
  "/jobs",
  authenticate,
  requireRole("admin"),
  validateResponse(syncJobsListResponseSchema),
  listSyncJobsController,
);

router.get(
  "/jobs/:id",
  authenticate,
  requireRole("admin"),
  validate(syncJobIdParamsSchema, "params"),
  validateResponse(syncJobResponseSchema),
  getSyncJobController,
);

/* ====================================
        EJECUTAR SYNC PIPELINE
==================================== */

router.post(
  "/",
  authenticate,
  requireRole("admin"),
  syncRateLimiter,
  syncExecutionLock,
  validateResponse(syncJobResponseSchema),
  createSyncJobTypeController("pipeline"),
);

router.post(
  "/graded-prices",
  authenticate,
  requireRole("admin"),
  syncRateLimiter,
  syncExecutionLock,
  validate(importGradedCardPricesSchema, "body"),
  validateResponse(gradedCardPricesImportResponseSchema),
  importGradedCardPricesController,
);

export default router;
