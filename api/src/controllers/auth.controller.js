import { loginUser } from "../services/auth.service.js";
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
