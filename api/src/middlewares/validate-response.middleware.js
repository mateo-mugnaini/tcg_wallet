import { createAppError } from "../errors/app.errors.js";
import { logger } from "../utils/logger.js";

/* ====================================
        VALIDAR RESPONSE
==================================== */

export function validateResponse(schema) {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = (data) => {
      const result = schema.safeParse(data);

      /* ====================================
            RESPONSE VÁLIDA
      ==================================== */

      if (result.success) {
        return originalJson(result.data);
      }

      /* ====================================
            RESPONSE INVÁLIDA
      ==================================== */

      logger.error("response_validation_failed", {
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        issues: result.error.issues,
      });

      // El errorMiddleware también responde con res.json(). Restauramos la
      // implementación original para no intentar validar la respuesta de error
      // contra el contrato exitoso y evitar que Express termine devolviendo HTML.
      res.json = originalJson;

      return next(
        createAppError(
          "La respuesta generada por el servidor no cumple con el contrato esperado",
          500,
        ),
      );
    };

    next();
  };
}
