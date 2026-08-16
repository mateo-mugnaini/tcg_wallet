/* ====================================
          ERROR MIDDLEWARE
==================================== */
import { logger } from "../utils/logger.js";
import env from "../config/env.js";

export function errorMiddleware(error, req, res, _next) {
  logger.error("request_error", {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    status: error.statusCode ?? 500,
    code: error.code,
    message: error.message,
    stack: env.nodeEnv === "production" ? undefined : error.stack,
  });

  if (error.statusCode) {
    return res.status(error.statusCode).json({
      status: "error",
      message: error.message,
    });
  }

  return res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
}
