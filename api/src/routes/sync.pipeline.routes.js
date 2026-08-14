import express from "express";

import { runSyncPipelineController } from "../controllers/sync.pipeline.controller.js";

import { authenticate } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = express.Router();

/* ====================================
        EJECUTAR SYNC PIPELINE
==================================== */

router.post("/", authenticate, requireRole("admin"), runSyncPipelineController);

export default router;
