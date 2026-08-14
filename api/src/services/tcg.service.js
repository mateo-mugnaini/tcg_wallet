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
             LISTAR TCGS
==================================== */

export async function getTcgs({
  search,
  page = 1,
  limit = 10,
  sortBy = "created_at",
  sortOrder = "DESC",
}) {
  /*
   * Normalizamos los valores de paginación.
   *
   * Esto evita que undefined, NaN o strings
   * inválidos lleguen al repository.
   */

  const normalizedPage = Number(page);
  const normalizedLimit = Number(limit);

  if (!Number.isInteger(normalizedPage) || normalizedPage < 1) {
    throw createAppError(
      "La página debe ser un número entero mayor o igual a 1",
      400,
    );
  }

  if (
    !Number.isInteger(normalizedLimit) ||
    normalizedLimit < 1 ||
    normalizedLimit > 100
  ) {
    throw createAppError(
      "El límite debe ser un número entero entre 1 y 100",
      400,
    );
  }

  const offset = (normalizedPage - 1) * normalizedLimit;

  const [tcgs, total] = await Promise.all([
    findTcgs({
      search,
      limit: normalizedLimit,
      offset,
      sortBy,
      sortOrder,
    }),

    countTcgs({
      search,
    }),
  ]);

  const totalPages = total === 0 ? 0 : Math.ceil(total / normalizedLimit);

  return {
    data: tcgs,
    pagination: {
      page: normalizedPage,
      limit: normalizedLimit,
      total,
      totalPages,
    },
  };
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

  return deleteTcg(id);
}
