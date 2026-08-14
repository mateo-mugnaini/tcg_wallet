import {
  findSets,
  countSets,
  createSet,
  updateSet,
  deleteSet,
  findSetById,
  findSetByName,
  findSetByExternalId,
} from "../repositories/sets.repository.js";

import { findTcgById } from "../repositories/tcg.repository.js";

import { createAppError } from "../errors/app.errors.js";

/* ====================================
          OBTENER SET POR ID
==================================== */

export async function getSetById(id) {
  const set = await findSetById(id);

  if (!set) {
    throw createAppError("Set no encontrado", 404);
  }

  return set;
}

/* ====================================
              CREAR SET
==================================== */

export async function registerSet({
  tcgId,
  externalId,
  name,
  code,
  releaseDate,
}) {
  /*
   * El TCG debe existir antes de crear
   * un Set asociado a él.
   */

  const tcg = await findTcgById(tcgId);

  if (!tcg) {
    throw createAppError("TCG no encontrado", 404);
  }

  /*
   * Si viene un externalId, comprobamos
   * que no exista ya dentro del TCG.
   *
   * Esto es especialmente importante
   * para Sets provenientes de una API externa.
   */

  if (externalId) {
    const existingSetByExternalId = await findSetByExternalId(
      tcgId,
      externalId,
    );

    if (existingSetByExternalId) {
      throw createAppError("El Set ya está registrado para este TCG", 409);
    }
  }

  /*
   * También evitamos duplicados por nombre
   * dentro del mismo TCG.
   */

  const existingSetByName = await findSetByName(tcgId, name);

  if (existingSetByName) {
    throw createAppError("El Set ya está registrado para este TCG", 409);
  }

  return createSet({
    tcgId,
    externalId,
    name,
    code,
    releaseDate,
  });
}

/* ====================================
             LISTAR SETS
==================================== */

export async function getSets({
  tcgId,
  search,
  page = 1,
  limit = 10,
  sortBy = "created_at",
  sortOrder = "DESC",
}) {
  /*
   * Normalizamos la paginación.
   *
   * Esto evita que undefined o NaN
   * lleguen al repository.
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

  /*
   * Si se proporciona un TCG,
   * comprobamos que exista.
   */

  if (tcgId) {
    const tcg = await findTcgById(tcgId);

    if (!tcg) {
      throw createAppError("TCG no encontrado", 404);
    }
  }

  const offset = (normalizedPage - 1) * normalizedLimit;

  const [sets, total] = await Promise.all([
    findSets({
      tcgId,
      search,
      limit: normalizedLimit,
      offset,
      sortBy,
      sortOrder,
    }),

    countSets({
      tcgId,
      search,
    }),
  ]);

  const totalPages = total === 0 ? 0 : Math.ceil(total / normalizedLimit);

  return {
    data: sets,
    pagination: {
      page: normalizedPage,
      limit: normalizedLimit,
      total,
      totalPages,
    },
  };
}

/* ====================================
            ACTUALIZAR SET
==================================== */

export async function editSet(
  id,
  { tcgId, externalId, name, code, releaseDate },
) {
  /*
   * Primero comprobamos que el Set
   * exista.
   */

  const existingSet = await findSetById(id);

  if (!existingSet) {
    throw createAppError("Set no encontrado", 404);
  }

  /*
   * Si se cambia el TCG,
   * comprobamos que el nuevo TCG exista.
   */

  if (tcgId !== undefined) {
    const tcg = await findTcgById(tcgId);

    if (!tcg) {
      throw createAppError("TCG no encontrado", 404);
    }
  }

  /*
   * Si cambia el TCG, externalId
   * o el nombre, comprobamos posibles
   * duplicados.
   */

  if (tcgId !== undefined || externalId !== undefined || name !== undefined) {
    const targetTcgId = tcgId ?? existingSet.tcg_id;

    const targetExternalId = externalId ?? existingSet.external_id;

    const targetName = name ?? existingSet.name;

    /*
     * Comprobar externalId.
     */

    if (targetExternalId) {
      const existingSetByExternalId = await findSetByExternalId(
        targetTcgId,
        targetExternalId,
      );

      if (existingSetByExternalId && existingSetByExternalId.id !== id) {
        throw createAppError(
          "El external_id ya está registrado para este TCG",
          409,
        );
      }
    }

    /*
     * Comprobar nombre.
     */

    const existingSetByName = await findSetByName(targetTcgId, targetName);

    if (existingSetByName && existingSetByName.id !== id) {
      throw createAppError("El Set ya está registrado para este TCG", 409);
    }
  }

  return updateSet(id, {
    tcgId,
    externalId,
    name,
    code,
    releaseDate,
  });
}

/* ====================================
             ELIMINAR SET
==================================== */

export async function removeSet(id) {
  const existingSet = await findSetById(id);

  if (!existingSet) {
    throw createAppError("Set no encontrado", 404);
  }

  return deleteSet(id);
}
