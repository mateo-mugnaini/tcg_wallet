import { loginUser, refreshUserToken } from "../services/auth.service.js";
/* =========================
        INICIAR SESION
============================ */

export async function login(req, res, next) {
  try {
    const result = await loginUser(req.body);
    return res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/* =========================
       REFRESCAR TOKEN
============================ */
export async function refresh(req, res, next) {
  try {
    const result = await refreshUserToken(req.body.refreshToken);

    return res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
