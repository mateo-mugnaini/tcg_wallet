import {
  editTcg,
  getTcgs,
  removeTcg,
  getTcgById,
  registerTcg,
} from "../services/tcg.service.js";

/* ====================================
               CREAR TCG
==================================== */
export async function createTcg(req, res, next) {
  try {
    const tcg = await registerTcg(req.validated.body);

    return res.status(201).json(tcg);
  } catch (error) {
    next(error);
  }
}

/* ====================================
            OBTENER TCG POR ID
==================================== */
export async function getTcg(req, res, next) {
  try {
    const tcg = await getTcgById(req.params.id);

    return res.status(200).json(tcg);
  } catch (error) {
    next(error);
  }
}

/* ====================================
              LISTAR TCGS
==================================== */
export async function getTcgsController(req, res, next) {
  try {
    const result = await getTcgs(req.validated.query);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/* ====================================
            ACTUALIZAR TCG
==================================== */
export async function updateTcg(req, res, next) {
  try {
    const tcg = await editTcg(req.params.id, req.validated.body);

    return res.status(200).json(tcg);
  } catch (error) {
    next(error);
  }
}

/* ====================================
             ELIMINAR TCG
==================================== */
export async function deleteTcg(req, res, next) {
  try {
    await removeTcg(req.params.id);

    return res.status(200).json({
      status: "success",
      message: "TCG eliminado correctamente",
    });
  } catch (error) {
    next(error);
  }
}
