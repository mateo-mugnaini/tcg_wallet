import {
  findSetByExternalId,
  upsertSet,
} from "../repositories/sets.repository.js";

import { findTcgByName } from "../repositories/tcg.repository.js";

import { getPokemonTcgSets } from "../integrations/pokemon-tcg/pokemon-tcg.client.js";

import { createAppError } from "../errors/app.errors.js";
import { logger } from "../utils/logger.js";

/* ====================================
        CONFIGURACIÓN SYNC
==================================== */

const POKEMON_TCG_NAME = "Pókemon";

const POKEMON_TCG_PAGE_SIZE = 100;

/*
 * La API debe devolver los Sets
 * desde el más reciente hacia el
 * más antiguo.
 */
const POKEMON_TCG_ORDER_BY = "-releaseDate";

/* ====================================
        UTILIDADES
==================================== */

function normalizeReleaseDate(releaseDate) {
  if (!releaseDate) {
    return null;
  }

  return releaseDate.replaceAll("/", "-");
}

/* ====================================
          SINCRONIZAR SETS
==================================== */

export async function syncPokemonSets() {
  const syncStartedAt = Date.now();

  logger.info("pokemon_set_sync_started");

  /* ====================================
          BUSCAR TCG
  ==================================== */

  const pokemonTcg = await findTcgByName(POKEMON_TCG_NAME);

  if (!pokemonTcg) {
    throw createAppError("El TCG Pokémon no existe en la base de datos", 404);
  }

  logger.info("pokemon_set_sync_tcg_resolved", {
    tcgId: pokemonTcg.id,
    tcgName: pokemonTcg.name,
  });

  /* ====================================
          CONTADORES
  ==================================== */

  let received = 0;
  let created = 0;
  let updated = 0;
  let unchanged = 0;
  let skipped = 0;

  let pagesProcessed = 0;
  let stoppedAtExisting = false;

  /* ====================================
          PAGINACIÓN
  ==================================== */

  let page = 1;

  while (true) {
    logger.debug("pokemon_set_sync_page_requested", {
      page,
      pageSize: POKEMON_TCG_PAGE_SIZE,
    });

    const response = await getPokemonTcgSets({
      page,
      pageSize: POKEMON_TCG_PAGE_SIZE,
      orderBy: POKEMON_TCG_ORDER_BY,
    });

    pagesProcessed++;

    const pageData = response.data ?? [];

    if (pageData.length === 0) {
      break;
    }

    for (const pokemonSet of pageData) {
      received++;

      const externalId = pokemonSet.id;

      /* ====================================
              VALIDACIÓN
      ==================================== */

      if (!externalId || !pokemonSet.name) {
        skipped++;

        logger.warn("pokemon_set_sync_set_skipped", {
          received,
          reason: "incomplete_data",
        });

        continue;
      }

      /* ====================================
              BUSCAR SET
      ==================================== */

      const existingSet = await findSetByExternalId(pokemonTcg.id, externalId);

      /*
       * ====================================
       * SET YA CONOCIDO
       * ====================================
       *
       * Como estamos recorriendo desde
       * el más nuevo hacia el más antiguo,
       * llegar a un Set existente significa
       * que todo lo que viene después ya
       * debería estar sincronizado.
       */

      if (existingSet) {
        stoppedAtExisting = true;

        logger.info("pokemon_set_sync_stopped_at_existing", {
          setName: existingSet.name,
          externalId,
        });

        break;
      }

      /* ====================================
              NORMALIZAR
      ==================================== */

      const setData = {
        tcgId: pokemonTcg.id,
        externalId,
        name: pokemonSet.name,
        code: pokemonSet.ptcgoCode ?? null,
        releaseDate: normalizeReleaseDate(pokemonSet.releaseDate),
      };

      /* ====================================
              CREAR SET
      ==================================== */

      await upsertSet(setData);

      created++;

      logger.info("pokemon_set_sync_set_created", {
        name: pokemonSet.name,
        externalId,
        releaseDate: setData.releaseDate,
      });
    }

    /*
     * Si encontramos un Set conocido,
     * terminamos completamente el sync.
     */

    if (stoppedAtExisting) {
      break;
    }

    /*
     * Si la página tiene menos elementos
     * que el pageSize, ya llegamos al final.
     */

    if (pageData.length < POKEMON_TCG_PAGE_SIZE) {
      break;
    }

    page++;
  }

  /* ====================================
          DURACIÓN
  ==================================== */

  const durationSeconds = Math.round((Date.now() - syncStartedAt) / 1000);

  /* ====================================
          SUMMARY
  ==================================== */

  const summary = {
    received,
    created,
    updated,
    unchanged,
    skipped,
    pagesProcessed,
    stoppedAtExisting,
    durationSeconds,
  };

  /* ====================================
          LOG FINAL
  ==================================== */

  logger.info("pokemon_set_sync_completed", summary);

  return {
    tcg: {
      id: pokemonTcg.id,
      name: pokemonTcg.name,
    },

    summary,
  };
}
