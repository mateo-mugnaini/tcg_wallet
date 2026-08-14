import { createAppError } from "../errors/app.errors.js";

/* ====================================
        VALIDAR PROPIETARIO
==================================== */
// export function requireOwnership(req, res, next) {
//   try {
//     if (!req.user) {
//       throw createAppError("Usuario no autenticado", 401);
//     }

//     const authenticatedUserId = req.user.id;
//     const requestedUserId = req.params.id;

//     if (authenticatedUserId !== requestedUserId) {
//       throw createAppError(
//         "No tienes permiso para acceder a este usuario",
//         403,
//       );
//     }

//     next();
//   } catch (error) {
//     next(error);
//   }
// }

/* ====================================
      PROPIETARIO O ROL AUTORIZADO
==================================== */
export function requireOwnershipOrRole(...allowedRoles) {
  return function (req, res, next) {
    try {
      if (!req.user) {
        throw createAppError("Usuario no autenticado", 401);
      }

      const authenticatedUserId = req.user.id;
      const requestedUserId = req.params.id;

      const hasAllowedRole = allowedRoles.includes(req.user.role);

      const isOwner = authenticatedUserId === requestedUserId;

      if (!hasAllowedRole && !isOwner) {
        throw createAppError(
          "No tienes permiso para acceder a este usuario",
          403,
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
