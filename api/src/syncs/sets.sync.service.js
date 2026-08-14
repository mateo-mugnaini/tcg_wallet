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

/* ====================================
        CONVERTIR FECHA
==================================== */

function normalizeReleaseDate(releaseDate) {
  if (!releaseDate) {
    return null;
  }

  /*
   * Pokémon TCG API:
   *
   * YYYY/MM/DD
   *
   * PostgreSQL:
   *
   * YYYY-MM-DD
   */

  return releaseDate.replaceAll("/", "-");
}

/* ====================================
          SINCRONIZAR SETS
==================================== */

export async function syncPokemonSets() {
  /*
   * ================================
   * 1. BUSCAR TCG
   * ================================
   */

  const pokemonTcg = await findTcgByName(POKEMON_TCG_NAME);

  if (!pokemonTcg) {
    throw createAppError("El TCG Pokémon no existe en la base de datos", 404);
  }

  /*
   * ================================
   * 2. OBTENER PRIMERA PÁGINA
   * ================================
   */

  const firstResponse = await getPokemonTcgSets({
    page: 1,
    pageSize: POKEMON_TCG_PAGE_SIZE,
  });

  const totalCount = firstResponse.totalCount ?? 0;

  const firstPageData = firstResponse.data ?? [];

  /*
   * ================================
   * 3. CALCULAR PÁGINAS
   * ================================
   */

  const totalPages = Math.ceil(totalCount / POKEMON_TCG_PAGE_SIZE);

  /*
   * ================================
   * 4. ACUMULAR SETS
   * ================================
   */

  const allSets = [...firstPageData];

  /*
   * ================================
   * 5. OBTENER PÁGINAS RESTANTES
   * ================================
   */

  for (let page = 2; page <= totalPages; page++) {
    const response = await getPokemonTcgSets({
      page,
      pageSize: POKEMON_TCG_PAGE_SIZE,
    });

    const pageData = response.data ?? [];

    allSets.push(...pageData);
  }

  /*
   * ================================
   * 6. SINCRONIZAR CON POSTGRESQL
   * ================================
   */

  let created = 0;
  let updated = 0;
  let unchanged = 0;
  let skipped = 0;

  for (const pokemonSet of allSets) {
    const externalId = pokemonSet.id;

    /*
     * Validación básica.
     */

    if (!externalId || !pokemonSet.name) {
      skipped++;

      console.warn(
        "[POKÉMON SYNC] Set ignorado por datos incompletos:",
        pokemonSet,
      );

      continue;
    }

    /*
     * Buscar si ya existe.
     */

    const existingSet = await findSetByExternalId(pokemonTcg.id, externalId);

    /*
     * Normalizar datos provenientes de API.
     */

    const setData = {
      tcgId: pokemonTcg.id,
      externalId,
      name: pokemonSet.name,
      code: pokemonSet.ptcgoCode ?? null,
      releaseDate: normalizeReleaseDate(pokemonSet.releaseDate),
    };

    /*
     * ================================
     * CREAR
     * ================================
     */

    if (!existingSet) {
      await upsertSet(setData);

      created++;

      continue;
    }

    /*
     * ================================
     * COMPROBAR CAMBIOS
     * ================================
     */

    const hasChanged =
      existingSet.name !== setData.name ||
      existingSet.code !== setData.code ||
      String(existingSet.release_date ?? "") !==
        String(setData.releaseDate ?? "");

    /*
     * ================================
     * SIN CAMBIOS
     * ================================
     */

    if (!hasChanged) {
      unchanged++;

      continue;
    }

    /*
     * ================================
     * ACTUALIZAR
     * ================================
     */

    await upsertSet(setData);

    updated++;
  }

  /*
   * ================================
   * 7. RESULTADO
   * ================================
   */

  const summary = {
    received: allSets.length,
    created,
    updated,
    unchanged,
    skipped,
  };

  console.log(
    `[POKÉMON SYNC] completed | received=${summary.received} | created=${summary.created} | updated=${summary.updated} | unchanged=${summary.unchanged} | skipped=${summary.skipped}`,
  );

  return {
    tcg: {
      id: pokemonTcg.id,
      name: pokemonTcg.name,
    },

    summary,
  };
}
