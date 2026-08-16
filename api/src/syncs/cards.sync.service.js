import {
  upsertCard,
  findCardByExternalId,
} from "../repositories/cards.repository.js";

import { findSets } from "../repositories/sets.repository.js";

import { getPokemonTcgCards } from "../integrations/pokemon-tcg/pokemon-tcg.client.js";

import { findTcgByName } from "../repositories/tcg.repository.js";

import { createAppError } from "../errors/app.errors.js";
import { logger } from "../utils/logger.js";

/* ====================================
        CONFIGURACIÓN SYNC
==================================== */

const POKEMON_TCG_NAME = "Pókemon";

const POKEMON_TCG_PAGE_SIZE = 250;

/*
 * Pausa entre requests.
 */
const API_REQUEST_DELAY_MS = 500;

/*
 * Pausa entre Sets.
 */
const SET_DELAY_MS = 1500;

/*
 * Reintentos para errores temporales.
 */
const MAX_RETRIES = 15;

const RETRY_BASE_DELAY_MS = 1500;

/* ====================================
              UTILIDADES
==================================== */

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isRetryableError(error) {
  if (
    error?.code === "POKEMON_TCG_API_UNAVAILABLE" ||
    error?.code === "POKEMON_TCG_API_TIMEOUT"
  ) {
    return true;
  }

  if (error?.code === "POKEMON_TCG_API_ERROR") {
    return [429, 500, 502, 503, 504].includes(error.details?.externalStatus);
  }

  return [500, 502, 503, 504].includes(error?.statusCode ?? error?.status);
}

async function getPokemonTcgCardsWithRetry(options) {
  let attempt = 0;

  while (true) {
    try {
      await sleep(API_REQUEST_DELAY_MS);

      return await getPokemonTcgCards(options);
    } catch (error) {
      attempt++;

      if (!isRetryableError(error)) {
        throw error;
      }

      if (attempt > MAX_RETRIES) {
        logger.error("pokemon_card_sync_api_request_failed", {
          retries: MAX_RETRIES,
        });

        throw error;
      }

      const retryDelay = Math.min(
        RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1),
        30_000,
      );

      logger.warn("pokemon_card_sync_api_retry", {
        status: error.status,
        attempt,
        maxRetries: MAX_RETRIES,
        retryDelayMs: retryDelay,
      });

      await sleep(retryDelay);
    }
  }
}

/* ====================================
          SINCRONIZAR CARDS
==================================== */

export async function syncPokemonCards() {
  const syncStartedAt = Date.now();

  logger.info("pokemon_card_sync_started");

  /* ====================================
          BUSCAR TCG
  ==================================== */

  const pokemonTcg = await findTcgByName(POKEMON_TCG_NAME);

  if (!pokemonTcg) {
    throw createAppError("El TCG Pokémon no existe en la base de datos", 404);
  }

  logger.info("pokemon_card_sync_tcg_resolved", {
    tcgId: pokemonTcg.id,
    tcgName: pokemonTcg.name,
  });

  /* ====================================
          OBTENER SETS
  ==================================== */

  const sets = await findSets({
    tcgId: pokemonTcg.id,
    limit: 1000,
    offset: 0,
    sortBy: "release_date",
    sortOrder: "DESC",
  });

  if (sets.length === 0) {
    throw createAppError("No existen Sets de Pokémon sincronizados", 404);
  }

  logger.info("pokemon_card_sync_sets_loaded", { count: sets.length });

  /* ====================================
          CONTADORES
  ==================================== */

  let received = 0;
  let created = 0;
  let updated = 0;
  let unchanged = 0;
  let skipped = 0;

  let setsProcessed = 0;
  let setsSkipped = 0;

  /* ====================================
              RECORRER SETS
  ==================================== */

  for (let setIndex = 0; setIndex < sets.length; setIndex++) {
    const set = sets[setIndex];

    const currentSet = setIndex + 1;

    /* ====================================
          VALIDAR EXTERNAL ID
    ==================================== */

    if (!set.external_id) {
      setsSkipped++;

      logger.warn("pokemon_card_sync_set_skipped", {
        currentSet,
        totalSets: sets.length,
        setName: set.name,
        reason: "missing_external_id",
      });

      continue;
    }

    let setReceived = 0;
    let setCreated = 0;
    let setUpdated = 0;
    let setUnchanged = 0;
    let setSkippedCards = 0;

    logger.info("pokemon_card_sync_set_started", {
      currentSet,
      totalSets: sets.length,
      setName: set.name,
      externalId: set.external_id,
    });

    /* ====================================
          PRIMERA PÁGINA
    ==================================== */

    const firstResponse = await getPokemonTcgCardsWithRetry({
      page: 1,
      pageSize: POKEMON_TCG_PAGE_SIZE,
      q: `set.id:${set.external_id}`,
    });

    const totalCount = firstResponse.totalCount ?? 0;

    const firstPageData = firstResponse.data ?? [];

    const totalPages = Math.ceil(totalCount / POKEMON_TCG_PAGE_SIZE);

    logger.debug("pokemon_card_sync_set_api_result", {
      currentSet,
      totalSets: sets.length,
      totalCards: totalCount,
      totalPages,
    });

    /* ====================================
          PROCESAR PRIMERA PÁGINA
    ==================================== */

    for (const pokemonCard of firstPageData) {
      const result = await syncPokemonCard(pokemonCard, set.id);

      received++;
      setReceived++;

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
        setSkippedCards++;
      }
    }

    /* ====================================
          PÁGINAS RESTANTES
    ==================================== */

    for (let page = 2; page <= totalPages; page++) {
      const response = await getPokemonTcgCardsWithRetry({
        page,
        pageSize: POKEMON_TCG_PAGE_SIZE,
        q: `set.id:${set.external_id}`,
      });

      const pageData = response.data ?? [];

      for (const pokemonCard of pageData) {
        const result = await syncPokemonCard(pokemonCard, set.id);

        received++;
        setReceived++;

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
          setSkippedCards++;
        }
      }
    }

    setsProcessed++;

    /* ====================================
          LOG DEL SET
    ==================================== */

    logger.info("pokemon_card_sync_set_completed", {
      currentSet,
      totalSets: sets.length,
      cardsReceived: setReceived,
      created: setCreated,
      updated: setUpdated,
      unchanged: setUnchanged,
      skipped: setSkippedCards,
    });

    await sleep(SET_DELAY_MS);
  }

  /* ====================================
          DURACIÓN
  ==================================== */

  const durationSeconds = Math.round((Date.now() - syncStartedAt) / 1000);

  /* ====================================
          SUMMARY
  ==================================== */

  const summary = {
    setsProcessed,
    setsSkipped,
    received,
    created,
    updated,
    unchanged,
    skipped,
    durationSeconds,
  };

  /* ====================================
          LOG FINAL
  ==================================== */

  logger.info("pokemon_card_sync_completed", {
    ...summary,
    totalSets: sets.length,
  });

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

  /* ====================================
          VALIDACIÓN
  ==================================== */

  if (!externalId || !pokemonCard.name) {
    return "skipped";
  }

  /* ====================================
          NORMALIZAR
  ==================================== */

  const cardData = {
    setId,
    externalId,
    name: pokemonCard.name,
    cardNumber: pokemonCard.number ?? null,
    rarity: pokemonCard.rarity ?? null,
    imageUrl: pokemonCard.images?.large ?? pokemonCard.images?.small ?? null,
  };

  /* ====================================
          BUSCAR EXISTENTE
  ==================================== */

  const existingCard = await findCardByExternalId(setId, externalId);

  /* ====================================
          CREAR
  ==================================== */

  if (!existingCard) {
    await upsertCard(cardData);

    return "created";
  }

  /* ====================================
          DETECTAR CAMBIOS
  ==================================== */

  const hasChanged =
    existingCard.name !== cardData.name ||
    existingCard.card_number !== cardData.cardNumber ||
    existingCard.rarity !== cardData.rarity ||
    existingCard.image_url !== cardData.imageUrl;

  /* ====================================
          SIN CAMBIOS
  ==================================== */

  if (!hasChanged) {
    return "unchanged";
  }

  /* ====================================
          ACTUALIZAR
  ==================================== */

  await upsertCard(cardData);

  return "updated";
}
