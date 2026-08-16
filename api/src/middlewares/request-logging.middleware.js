import { randomUUID } from "node:crypto";

import { logger } from "../utils/logger.js";
import { recordHttpRequest } from "../utils/metrics.js";

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;

function resolveRequestId(value) {
  return typeof value === "string" && REQUEST_ID_PATTERN.test(value)
    ? value
    : randomUUID();
}

export function requestLogging(req, res, next) {
  const requestId = resolveRequestId(req.get("x-request-id"));
  const startedAt = process.hrtime.bigint();

  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const normalizedDurationMs = Number(durationMs.toFixed(2));
    const path = req.route?.path ?? req.path;

    recordHttpRequest({
      method: req.method,
      path,
      status: res.statusCode,
      durationMs: normalizedDurationMs,
    });

    logger.info("http_request", {
      requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: normalizedDurationMs,
      userId: req.user?.id,
    });
  });

  next();
}
