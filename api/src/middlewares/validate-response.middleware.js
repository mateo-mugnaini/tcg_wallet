import { createAppError } from "../errors/app.errors.js";

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

      console.error("");
      console.error("====================================");
      console.error("[RESPONSE VALIDATION ERROR]");
      console.error("====================================");
      console.error("Method:", req.method);
      console.error("Path:", req.originalUrl);
      console.error("Status:", res.statusCode);
      console.error("Zod issues:");
      console.error(result.error.issues);
      console.error("====================================");
      console.error("");

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
