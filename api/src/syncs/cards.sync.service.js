import {
  upsertCard,
  findCardByExternalId,
} from "../repositories/cards.repository.js";

import { findSets } from "../repositories/sets.repository.js";

import { getPokemonTcgCards } from "../integrations/pokemon-tcg/pokemon-tcg.client.js";

import { findTcgByName } from "../repositories/tcg.repository.js";

import { createAppError } from "../errors/app.errors.js";

/* ====================================
        CONFIGURACIÓN SYNC
==================================== */

const POKEMON_TCG_NAME = "Pókemon";

const POKEMON_TCG_PAGE_SIZE = 250;

/*
 * Pausa entre requests a Pokémon TCG API.
 *
 * Esto evita lanzar requests demasiado
 * rápidamente cuando recorremos muchos Sets.
 */
const API_REQUEST_DELAY_MS = 500;

/*
 * Pausa entre Sets.
 *
 * Es ligeramente mayor porque cada Set
 * puede requerir uno o varios requests.
 */
const SET_DELAY_MS = 1500;

/*
 * Cantidad máxima de reintentos ante
 * errores temporales de la API.
 */
const MAX_RETRIES = 10;

/*
 * Tiempo base utilizado para el backoff.
 *
 * Reintento 1 -> 1000 ms
 * Reintento 2 -> 2000 ms
 * Reintento 3 -> 4000 ms
 */
const RETRY_BASE_DELAY_MS = 1000;

/* ====================================
              UTILIDADES
==================================== */

/*
 * Pausa la ejecución durante determinada
 * cantidad de milisegundos.
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/*
 * Determina si un status HTTP representa
 * un error temporal que merece retry.
 */
function isRetryableStatus(status) {
  return [500, 502, 503, 504].includes(status);
}

/*
 * Ejecuta una petición contra Pokémon TCG API
 * con retry automático para errores temporales.
 */
async function getPokemonTcgCardsWithRetry(options) {
  let attempt = 0;

  while (true) {
    try {
      /*
       * Esperamos antes de realizar el request.
       *
       * Esto también aplica al primer request.
       */
      await sleep(API_REQUEST_DELAY_MS);

      return await getPokemonTcgCards(options);
    } catch (error) {
      attempt++;

      /*
       * Si el error no es temporal,
       * lo propagamos inmediatamente.
       */
      if (!isRetryableStatus(error.status)) {
        throw error;
      }

      /*
       * Si agotamos los reintentos,
       * propagamos el error original.
       */
      if (attempt > MAX_RETRIES) {
        console.error(
          `[POKÉMON SYNC] API request failed after ${MAX_RETRIES} retries`,
        );

        throw error;
      }

      /*
       * Backoff exponencial:
       *
       * attempt 1 -> 1s
       * attempt 2 -> 2s
       * attempt 3 -> 4s
       */
      const retryDelay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);

      console.warn(
        `[POKÉMON SYNC] API error ${error.status} | retry=${attempt}/${MAX_RETRIES} | waiting=${retryDelay}ms`,
      );

      await sleep(retryDelay);
    }
  }
}

/* ====================================
          SINCRONIZAR CARDS
==================================== */

export async function syncPokemonCards() {
  const pokemonTcg = await findTcgByName(POKEMON_TCG_NAME);

  if (!pokemonTcg) {
    throw createAppError("El TCG Pokémon no existe en la base de datos", 404);
  }

  /*
   * Obtener todos los Sets Pokémon
   * que ya fueron sincronizados.
   *
   * Los procesamos desde el más antiguo
   * hasta el más reciente.
   */
  const sets = await findSets({
    tcgId: pokemonTcg.id,
    limit: 1000,
    offset: 0,
    sortBy: "release_date",
    sortOrder: "ASC",
  });

  if (sets.length === 0) {
    throw createAppError("No existen Sets de Pokémon sincronizados", 404);
  }

  let received = 0;
  let created = 0;
  let updated = 0;
  let unchanged = 0;
  let skipped = 0;

  /*
   * ====================================
   * RECORRER SETS
   * ====================================
   */

  for (const set of sets) {
    /*
     * Un Set sin external_id no puede
     * consultarse contra Pokémon TCG API.
     */
    if (!set.external_id) {
      skipped++;

      console.warn(
        `[POKÉMON SYNC] set=${set.name} | skipped=missing_external_id`,
      );

      continue;
    }

    let setReceived = 0;
    let setCreated = 0;
    let setUpdated = 0;
    let setUnchanged = 0;
    let setSkipped = 0;

    /*
     * ====================================
     * PRIMERA PÁGINA
     * ====================================
     */

    const firstResponse = await getPokemonTcgCardsWithRetry({
      page: 1,
      pageSize: POKEMON_TCG_PAGE_SIZE,
      q: `set.id:${set.external_id}`,
    });

    const totalCount = firstResponse.totalCount ?? 0;

    const firstPageData = firstResponse.data ?? [];

    received += firstPageData.length;
    setReceived += firstPageData.length;

    /*
     * ====================================
     * CALCULAR PÁGINAS
     * ====================================
     */

    const totalPages = Math.ceil(totalCount / POKEMON_TCG_PAGE_SIZE);

    /*
     * ====================================
     * PROCESAR PRIMERA PÁGINA
     * ====================================
     */

    for (const pokemonCard of firstPageData) {
      const result = await syncPokemonCard(pokemonCard, set.id);

      if (result === "created") {
        created++;
        setCreated++;
      }

      if (result === "updated") {
        updated++;
        setUpdated++;
      }

      if (result === "unchanged") {
        unchanged++;
        setUnchanged++;
      }

      if (result === "skipped") {
        skipped++;
        setSkipped++;
      }
    }

    /*
     * ====================================
     * OBTENER PÁGINAS RESTANTES
     * ====================================
     */

    for (let page = 2; page <= totalPages; page++) {
      const response = await getPokemonTcgCardsWithRetry({
        page,
        pageSize: POKEMON_TCG_PAGE_SIZE,
        q: `set.id:${set.external_id}`,
      });

      const pageData = response.data ?? [];

      received += pageData.length;
      setReceived += pageData.length;

      for (const pokemonCard of pageData) {
        const result = await syncPokemonCard(pokemonCard, set.id);

        if (result === "created") {
          created++;
          setCreated++;
        }

        if (result === "updated") {
          updated++;
          setUpdated++;
        }

        if (result === "unchanged") {
          unchanged++;
          setUnchanged++;
        }

        if (result === "skipped") {
          skipped++;
          setSkipped++;
        }
      }
    }

    /*
     * ====================================
     * LOG DEL SET
     * ====================================
     */

    console.log(
      `[POKÉMON SYNC] set=${set.name} | received=${setReceived} | created=${setCreated} | updated=${setUpdated} | unchanged=${setUnchanged} | skipped=${setSkipped}`,
    );

    /*
     * Pausa antes de pasar al siguiente Set.
     */
    await sleep(SET_DELAY_MS);
  }

  /*
   * ====================================
   * RESUMEN FINAL
   * ====================================
   */

  const summary = {
    received,
    created,
    updated,
    unchanged,
    skipped,
  };

  console.log(
    `[POKÉMON SYNC] cards completed | received=${summary.received} | created=${summary.created} | updated=${summary.updated} | unchanged=${summary.unchanged} | skipped=${summary.skipped}`,
  );

  return {
    tcg: {
      id: pokemonTcg.id,
      name: pokemonTcg.name,
    },

    summary,
  };
}

/* ====================================
        SINCRONIZAR CARD INDIVIDUAL
==================================== */

async function syncPokemonCard(pokemonCard, setId) {
  const externalId = pokemonCard.id;

  /*
   * ====================================
   * VALIDACIÓN MÍNIMA
   * ====================================
   */

  if (!externalId || !pokemonCard.name) {
    return "skipped";
  }

  /*
   * ====================================
   * NORMALIZAR CARD
   * ====================================
   */

  const cardData = {
    setId,
    externalId,
    name: pokemonCard.name,
    cardNumber: pokemonCard.number ?? null,
    rarity: pokemonCard.rarity ?? null,
    imageUrl: pokemonCard.images?.large ?? pokemonCard.images?.small ?? null,
  };

  /*
   * ====================================
   * BUSCAR CARD EXISTENTE
   * ====================================
   */

  const existingCard = await findCardByExternalId(setId, externalId);

  /*
   * ====================================
   * CARD NUEVA
   * ====================================
   */

  if (!existingCard) {
    await upsertCard(cardData);

    return "created";
  }

  /*
   * ====================================
   * DETECTAR CAMBIOS
   * ====================================
   */

  const hasChanged =
    existingCard.name !== cardData.name ||
    existingCard.card_number !== cardData.cardNumber ||
    existingCard.rarity !== cardData.rarity ||
    existingCard.image_url !== cardData.imageUrl;

  /*
   * ====================================
   * SIN CAMBIOS
   * ====================================
   */

  if (!hasChanged) {
    return "unchanged";
  }

  /*
   * ====================================
   * ACTUALIZAR
   * ====================================
   */

  await upsertCard(cardData);

  return "updated";
}
