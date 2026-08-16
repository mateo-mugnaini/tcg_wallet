import express from "express";

import pool from "../config/database.js";
import { logger } from "../utils/logger.js";
import { getMetricsSnapshot } from "../utils/metrics.js";
import { isAcceptingRequests } from "../runtime/app-state.js";

const router = express.Router();

function liveness(_req, res) {
  return res.status(200).json({
    status: "ok",
  });
}

router.get("/health", liveness);
router.get("/health/live", liveness);

router.get("/health/ready", async (req, res) => {
  const startedAt = process.hrtime.bigint();

  if (!isAcceptingRequests()) {
    return res.status(503).json({
      status: "not_ready",
      checks: {
        app: "shutting_down",
      },
    });
  }

  try {
    await pool.query("SELECT 1");

    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

    return res.status(200).json({
      status: "ready",
      checks: {
        database: "ok",
      },
      durationMs: Number(durationMs.toFixed(2)),
    });
  } catch (error) {
    logger.error("readiness_check_failed", {
      requestId: req.requestId,
      check: "database",
      message: error.message,
    });

    return res.status(503).json({
      status: "not_ready",
      checks: {
        database: "unavailable",
      },
    });
  }
});

router.get("/metrics", (_req, res) => {
  return res.status(200).json({
    status: "ok",
    metrics: getMetricsSnapshot(),
  });
});

export default router;
