import { createAppError } from "../errors/app.errors.js";

/* ====================================
        VALIDAR PROPIETARIO
==================================== */
export function requireUserOwnership(req, res, next) {
  try {
    const authenticatedUserId = req.user.id;
    const requestedUserId = req.params.id;

    if (authenticatedUserId !== requestedUserId) {
      throw createAppError(
        "No tienes permiso para acceder a este usuario",
        403,
      );
    }

    next();
  } catch (error) {
    next(error);
  }
}
