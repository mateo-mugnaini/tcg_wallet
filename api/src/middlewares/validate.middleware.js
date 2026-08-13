/* ====================================
          VALIDAR REQUEST
==================================== */
export function validate(schema, target = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      return res.status(400).json({
        status: "error",
        message: "Datos de entrada inválidos",
        errors: result.error.issues,
      });
    }

    if (!req.validated) {
      req.validated = {};
    }

    req.validated[target] = result.data;

    next();
  };
}
