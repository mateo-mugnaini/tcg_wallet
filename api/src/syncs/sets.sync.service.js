import {
  findSetByExternalId,
  upsertSet,
} from "../repositories/sets.repository.js";

import { findTcgByName } from "../repositories/tcg.repository.js";

import { getPokemonTcgSets } from "../integrations/pokemon-tcg/pokemon-tcg.client.js";

import { createAppError } from "../errors/app.errors.js";

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

  console.log("");
  console.log("============================================================");
  console.log("[POKÉMON SET SYNC] STARTING");
  console.log("============================================================");

  /* ====================================
          BUSCAR TCG
  ==================================== */

  const pokemonTcg = await findTcgByName(POKEMON_TCG_NAME);

  if (!pokemonTcg) {
    throw createAppError("El TCG Pokémon no existe en la base de datos", 404);
  }

  console.log(`[POKÉMON SET SYNC] TCG: ${pokemonTcg.name}`);

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
    console.log(
      `[POKÉMON SET SYNC] Fetching page=${page} | pageSize=${POKEMON_TCG_PAGE_SIZE}`,
    );

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

        console.warn(
          `[POKÉMON SET SYNC] SET ${received} | SKIPPED | incomplete data`,
        );

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

        console.log("");
        console.log(
          `[POKÉMON SET SYNC] STOP | existing set found: ${existingSet.name} | external_id=${externalId}`,
        );
        console.log(
          "[POKÉMON SET SYNC] Remaining older Sets were not requested.",
        );

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

      console.log(
        `[POKÉMON SET SYNC] CREATED | ${pokemonSet.name} | external_id=${externalId} | release=${setData.releaseDate ?? "unknown"}`,
      );
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

  console.log("");
  console.log("============================================================");
  console.log("[POKÉMON SET SYNC] COMPLETED");
  console.log("============================================================");

  console.log(`[POKÉMON SET SYNC] Received: ${summary.received}`);

  console.log(`[POKÉMON SET SYNC] Created: ${summary.created}`);

  console.log(`[POKÉMON SET SYNC] Updated: ${summary.updated}`);

  console.log(`[POKÉMON SET SYNC] Unchanged: ${summary.unchanged}`);

  console.log(`[POKÉMON SET SYNC] Skipped: ${summary.skipped}`);

  console.log(`[POKÉMON SET SYNC] Pages processed: ${summary.pagesProcessed}`);

  console.log(
    `[POKÉMON SET SYNC] Stopped at existing: ${summary.stoppedAtExisting}`,
  );

  console.log(`[POKÉMON SET SYNC] Duration: ${summary.durationSeconds}s`);

  console.log("============================================================");
  console.log("");

  return {
    tcg: {
      id: pokemonTcg.id,
      name: pokemonTcg.name,
    },

    summary,
  };
}
