import { createAppError } from "../errors/app.errors.js";

/* ====================================
          VALIDAR ROL DE USUARIO
==================================== */
export function requireRole(...allowedRoles) {
  return function (req, res, next) {
    try {
      if (!req.user) {
        throw createAppError("Usuario no autenticado", 401);
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw createAppError(
          "No tienes permisos para realizar esta acción",
          403,
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
