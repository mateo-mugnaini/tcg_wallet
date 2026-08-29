/* ====================================
          VALIDAR REQUEST
==================================== */
export function validate(schema, target = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      return res.status(400).json({
        status: "error",
        code: "VALIDATION_ERROR",
        message: "Revisa los datos ingresados.",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    if (!req.validated) {
      req.validated = {};
    }

    req.validated[target] = result.data;

    next();
  };
}
