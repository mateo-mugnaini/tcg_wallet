import {
  loginUser,
  logoutUser,
  refreshUserToken,
} from "../services/auth.service.js";

import { refreshTokenCookieOptions } from "../config/security.js";

import { createAppError } from "../errors/app.errors.js";

/* =========================
        INICIAR SESIÓN
============================ */

export async function login(req, res, next) {
  try {
    const result = await loginUser(req.validated.body);

    res.cookie("refreshToken", result.refreshToken, refreshTokenCookieOptions);

    return res.status(200).json({
      status: "success",
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    });
  } catch (error) {
    next(error);
  }
}

/* =========================
       REFRESCAR TOKEN
============================ */

export async function refresh(req, res, next) {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      throw createAppError("Refresh token requerido", 401);
    }

    const result = await refreshUserToken(refreshToken);

    res.cookie("refreshToken", result.refreshToken, refreshTokenCookieOptions);

    return res.status(200).json({
      status: "success",
      data: {
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

/* =========================
        CERRAR SESIÓN
============================ */

export async function logout(req, res, next) {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      await logoutUser(refreshToken);
    }

    res.clearCookie("refreshToken", refreshTokenCookieOptions);

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
}
