import {
  findTcgs,
  countTcgs,
  createTcg,
  updateTcg,
  deleteTcg,
  findTcgById,
  findTcgByName,
} from "../repositories/tcg.repository.js";

import { createAppError } from "../errors/app.errors.js";

/* ====================================
             OBTENER TCG POR ID
==================================== */
export async function getTcgById(id) {
  const tcg = await findTcgById(id);

  if (!tcg) {
    throw createAppError("TCG no encontrado", 404);
  }

  return tcg;
}

/* ====================================
              OBTENER TCGS
==================================== */
export async function getTcgs({ page, limit, search, sortBy, sortOrder }) {
  const offset = (page - 1) * limit;

  const [tcgs, total] = await Promise.all([
    findTcgs({
      search,
      limit,
      offset,
      sortBy,
      sortOrder,
    }),

    countTcgs({
      search,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: tcgs,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

/* ====================================
               CREAR TCG
==================================== */
export async function registerTcg({ name }) {
  const existingTcg = await findTcgByName(name);

  if (existingTcg) {
    throw createAppError("El TCG ya está registrado", 409);
  }

  return createTcg({
    name,
  });
}

/* ====================================
             ACTUALIZAR TCG
==================================== */
export async function editTcg(id, { name }) {
  const existingTcg = await findTcgById(id);

  if (!existingTcg) {
    throw createAppError("TCG no encontrado", 404);
  }

  if (name !== undefined) {
    const existingTcgByName = await findTcgByName(name);

    if (existingTcgByName && existingTcgByName.id !== id) {
      throw createAppError("El TCG ya está registrado", 409);
    }
  }

  return updateTcg(id, {
    name,
  });
}

/* ====================================
              ELIMINAR TCG
==================================== */
export async function removeTcg(id) {
  const existingTcg = await findTcgById(id);

  if (!existingTcg) {
    throw createAppError("TCG no encontrado", 404);
  }

  try {
    return await deleteTcg(id);
  } catch (error) {
    /*
     * PostgreSQL devuelve un error de
     * foreign key cuando el TCG tiene
     * Sets asociados.
     */
    if (error.code === "23503") {
      throw createAppError(
        "No se puede eliminar el TCG porque tiene Sets asociados",
        409,
      );
    }

    throw error;
  }
}
