import {
  getSetById,
  getSets,
  registerSet,
  editSet,
  removeSet,
} from "../services/sets.service.js";

import { syncPokemonSets } from "../services/sets.sync.service.js";

/* ====================================
          OBTENER SET POR ID
==================================== */

export async function getSet(req, res, next) {
  try {
    const { id } = req.params;

    const set = await getSetById(id);

    return res.status(200).json(set);
  } catch (error) {
    next(error);
  }
}

/* ====================================
             LISTAR SETS
==================================== */

export async function getSetsController(req, res, next) {
  try {
    const { tcgId, search, page, limit, sortBy, sortOrder } = req.query;

    const result = await getSets({
      tcgId,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/* ====================================
              CREAR SET
==================================== */

export async function createSet(req, res, next) {
  try {
    const { tcgId, externalId, name, code, releaseDate } = req.body;

    const set = await registerSet({
      tcgId,
      externalId,
      name,
      code,
      releaseDate,
    });

    return res.status(201).json(set);
  } catch (error) {
    next(error);
  }
}

/* ====================================
            ACTUALIZAR SET
==================================== */

export async function updateSet(req, res, next) {
  try {
    const { id } = req.params;

    const { tcgId, externalId, name, code, releaseDate } = req.body;

    const set = await editSet(id, {
      tcgId,
      externalId,
      name,
      code,
      releaseDate,
    });

    return res.status(200).json(set);
  } catch (error) {
    next(error);
  }
}

/* ====================================
             ELIMINAR SET
==================================== */

export async function deleteSet(req, res, next) {
  try {
    const { id } = req.params;

    const set = await removeSet(id);

    return res.status(200).json(set);
  } catch (error) {
    next(error);
  }
}

/* ====================================
        SINCRONIZAR POKÉMON SETS
==================================== */

export async function syncPokemonSetsController(req, res, next) {
  try {
    const result = await syncPokemonSets();

    return res.status(200).json({
      status: "success",
      message: "Sets de Pokémon sincronizados correctamente",
      ...result,
    });
  } catch (error) {
    next(error);
  }
}
