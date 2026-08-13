import { verifyAccessToken } from "../utils/jwt.js";
import { createAppError } from "../errors/app.errors.js";

/* ====================================
          AUTENTICAR USUARIO
==================================== */
export async function authenticate(req, res, next) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      throw createAppError("Token de autenticación requerido", 401);
    }

    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw createAppError("Formato de autenticación inválido", 401);
    }

    const payload = verifyAccessToken(token);

    req.user = {
      id: payload.sub,
    };

    next();
  } catch (error) {
    next(error);
  }
}
