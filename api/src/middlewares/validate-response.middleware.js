import { createAppError } from "../errors/app.errors.js";

/* ====================================
        VALIDAR RESPONSE
==================================== */

export function validateResponse(schema) {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = (data) => {
      const result = schema.safeParse(data);

      if (!result.success) {
        return next(
          createAppError(
            "La respuesta generada por el servidor no cumple con el contrato esperado",
            500,
          ),
        );
      }

      return originalJson(result.data);
    };

    next();
  };
}
