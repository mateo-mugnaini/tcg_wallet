import {
  getTcgById,
  getTcgs,
  registerTcg,
  editTcg,
  removeTcg,
} from "../services/tcg.service.js";

/* ====================================
            OBTENER TCG POR ID
==================================== */

export async function getTcg(req, res, next) {
  try {
    const { id } = req.params;

    const tcg = await getTcgById(id);

    res.status(200).json(tcg);
  } catch (error) {
    next(error);
  }
}

/* ====================================
              LISTAR TCGS
==================================== */

export async function getTcgsController(req, res, next) {
  try {
    const { search, page, limit, sortBy, sortOrder } = req.query;

    const result = await getTcgs({
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/* ====================================
              CREAR TCG
==================================== */

export async function createTcg(req, res, next) {
  try {
    const { name } = req.body;

    const tcg = await registerTcg({
      name,
    });

    res.status(201).json(tcg);
  } catch (error) {
    next(error);
  }
}

/* ====================================
            ACTUALIZAR TCG
==================================== */

export async function updateTcg(req, res, next) {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const tcg = await editTcg(id, {
      name,
    });

    res.status(200).json(tcg);
  } catch (error) {
    next(error);
  }
}

/* ====================================
              ELIMINAR TCG
==================================== */

export async function deleteTcg(req, res, next) {
  try {
    const { id } = req.params;

    const tcg = await removeTcg(id);

    res.status(200).json(tcg);
  } catch (error) {
    next(error);
  }
}
