import { findCardsByExternalIds } from "../repositories/cards.repository.js";

import {
  createCardPrices,
  findLatestCardPricesByCardIds,
} from "../repositories/cards-prices.repository.js";

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

const PRICE_SOURCE = "pokemon-tcg";

const PRICE_CURRENCY = "USD";

const MAX_RETRIES = 15;

const RETRY_BASE_DELAY = 1500;
const RETRY_MAX_DELAY = 30_000;

const PRICE_INSERT_BATCH_SIZE = 500;

/* ====================================
              DELAY
==================================== */

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/* ====================================
        DETERMINAR RETRY
==================================== */

function shouldRetryPokemonTcgError(error) {
  if (error?.code === "POKEMON_TCG_API_UNAVAILABLE") {
    return true;
  }

  if (error?.code === "POKEMON_TCG_API_TIMEOUT") {
    return true;
  }

  if (error?.code === "POKEMON_TCG_API_ERROR") {
    const externalStatus = error?.details?.externalStatus;

    return [429, 500, 502, 503, 504].includes(externalStatus);
  }

  return false;
}

/* ====================================
        REQUEST CON RETRY
==================================== */

async function getPokemonTcgCardsWithRetry(options) {
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await getPokemonTcgCards(options);
    } catch (error) {
      lastError = error;

      if (!shouldRetryPokemonTcgError(error)) {
        throw error;
      }

      if (attempt === MAX_RETRIES) {
        logger.error("pokemon_price_sync_api_request_failed", {
          attempts: MAX_RETRIES,
        });

        throw error;
      }

      const waitTime = Math.min(RETRY_BASE_DELAY * attempt, RETRY_MAX_DELAY);

      logger.warn("pokemon_price_sync_api_retry", {
        code: error.code ?? "unknown",
        attempt,
        maxRetries: MAX_RETRIES,
        retryDelayMs: waitTime,
      });

      await delay(waitTime);
    }
  }

  throw lastError;
}

/* ====================================
        CREAR PRECIOS EN BATCH
==================================== */

async function createCardPricesInBatches(cardPrices) {
  if (!Array.isArray(cardPrices) || cardPrices.length === 0) {
    return 0;
  }

  let created = 0;

  for (
    let index = 0;
    index < cardPrices.length;
    index += PRICE_INSERT_BATCH_SIZE
  ) {
    const batch = cardPrices.slice(index, index + PRICE_INSERT_BATCH_SIZE);

    const insertedPrices = await createCardPrices(batch);

    created += insertedPrices.length;
  }

  return created;
}

/* ====================================
        SINCRONIZAR PRECIOS
==================================== */

export async function syncPokemonCardPrices() {
  const syncStartedAt = Date.now();

  logger.info("pokemon_price_sync_started");

  /* ====================================
          BUSCAR TCG
  ==================================== */

  const pokemonTcg = await findTcgByName(POKEMON_TCG_NAME);

  if (!pokemonTcg) {
    throw createAppError("El TCG Pokémon no existe en la base de datos", 404);
  }

  logger.info("pokemon_price_sync_tcg_resolved", {
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

  logger.info("pokemon_price_sync_sets_loaded", { count: sets.length });

  /* ====================================
          CONTADORES
  ==================================== */

  let received = 0;

  let pricesCreated = 0;
  let pricesSkipped = 0;

  let skippedCards = 0;
  let skippedSets = 0;

  let setsProcessed = 0;

  /* ====================================
          RECORRER SETS
  ==================================== */

  for (let setIndex = 0; setIndex < sets.length; setIndex++) {
    const set = sets[setIndex];

    const currentSet = setIndex + 1;

    /* ====================================
          VALIDAR SET
    ==================================== */

    if (!set.external_id) {
      skippedSets++;

      logger.warn("pokemon_price_sync_set_skipped", {
        currentSet,
        totalSets: sets.length,
        setName: set.name,
        reason: "missing_external_id",
      });

      continue;
    }

    logger.info("pokemon_price_sync_set_started", {
      currentSet,
      totalSets: sets.length,
      setName: set.name,
      externalId: set.external_id,
    });

    /* ====================================
          OBTENER PRIMERA PÁGINA
    ==================================== */

    const firstResponse = await getPokemonTcgCardsWithRetry({
      page: 1,
      pageSize: POKEMON_TCG_PAGE_SIZE,
      q: `set.id:${set.external_id}`,
    });

    const totalCount = firstResponse.totalCount ?? 0;

    const firstPageData = firstResponse.data ?? [];

    const totalPages = Math.ceil(totalCount / POKEMON_TCG_PAGE_SIZE);

    logger.debug("pokemon_price_sync_set_api_result", {
      currentSet,
      totalSets: sets.length,
      totalCards: totalCount,
      totalPages,
    });

    /* ====================================
          OBTENER TODAS LAS CARDS DEL SET
    ==================================== */

    const pokemonCards = [...firstPageData];

    for (let page = 2; page <= totalPages; page++) {
      const response = await getPokemonTcgCardsWithRetry({
        page,
        pageSize: POKEMON_TCG_PAGE_SIZE,
        q: `set.id:${set.external_id}`,
      });

      pokemonCards.push(...(response.data ?? []));
    }

    received += pokemonCards.length;

    /* ====================================
          BUSCAR CARDS LOCALES EN BLOQUE
    ==================================== */

    const externalIds = pokemonCards
      .map((pokemonCard) => pokemonCard.id)
      .filter(Boolean);

    const cards = await findCardsByExternalIds({
      setId: set.id,
      externalIds,
    });

    /* ====================================
          INDEXAR CARDS
    ==================================== */

    const cardsByExternalId = new Map(
      cards.map((card) => [card.external_id, card]),
    );

    /* ====================================
          CONTADORES DEL SET
    ==================================== */

    let setPricesCreated = 0;
    let setPricesSkipped = 0;
    let setSkippedCards = 0;

    /* ====================================
          OBTENER ÚLTIMOS PRECIOS EN BLOQUE
    ==================================== */

    const cardIds = cards.map((card) => card.id);

    const latestPrices = await findLatestCardPricesByCardIds({
      cardIds,
      source: PRICE_SOURCE,
    });

    /* ====================================
          INDEXAR ÚLTIMOS PRECIOS
    ==================================== */

    const latestPriceMap = new Map();

    for (const price of latestPrices) {
      const key = `${price.card_id}:${price.condition}`;

      latestPriceMap.set(key, price);
    }

    /* ====================================
          ACUMULAR PRECIOS NUEVOS
    ==================================== */

    const pricesToCreate = [];

    /* ====================================
          PROCESAR CARDS
    ==================================== */

    for (const pokemonCard of pokemonCards) {
      /* ====================================
              VALIDAR CARD
      ==================================== */

      if (!pokemonCard.id || !pokemonCard.name) {
        skippedCards++;
        setSkippedCards++;
        continue;
      }

      /* ====================================
              BUSCAR CARD EN MEMORIA
      ==================================== */

      const card = cardsByExternalId.get(pokemonCard.id);

      if (!card) {
        skippedCards++;
        setSkippedCards++;
        continue;
      }

      /* ====================================
              OBTENER PRECIOS
      ==================================== */

      const prices = pokemonCard.tcgplayer?.prices;

      if (!prices || typeof prices !== "object") {
        setPricesSkipped++;
        continue;
      }

      /* ====================================
              PROCESAR CONDITIONS
      ==================================== */

      for (const [condition, priceData] of Object.entries(prices)) {
        /* ====================================
              VALIDAR PRICE DATA
        ==================================== */

        if (!priceData || typeof priceData !== "object") {
          setPricesSkipped++;
          continue;
        }

        /* ====================================
              MARKET PRICE
        ==================================== */

        const marketPrice = priceData.market;

        if (marketPrice === undefined || marketPrice === null) {
          setPricesSkipped++;
          continue;
        }

        const numericPrice = Number(marketPrice);

        if (!Number.isFinite(numericPrice)) {
          setPricesSkipped++;
          continue;
        }

        /* ====================================
              BUSCAR ÚLTIMO PRECIO EN MEMORIA
        ==================================== */

        const key = `${card.id}:${condition}`;

        const latestPrice = latestPriceMap.get(key);

        /* ====================================
              PRECIO SIN CAMBIOS
        ==================================== */

        if (latestPrice && Number(latestPrice.price) === numericPrice) {
          setPricesSkipped++;
          continue;
        }

        /* ====================================
              ACUMULAR PRECIO PARA BATCH
        ==================================== */

        pricesToCreate.push({
          cardId: card.id,
          condition,
          price: numericPrice,
          currency: PRICE_CURRENCY,
          source: PRICE_SOURCE,
        });

        /* ====================================
              ACTUALIZAR CACHE LOCAL
        ==================================== */

        latestPriceMap.set(key, {
          card_id: card.id,
          condition,
          price: numericPrice,
          currency: PRICE_CURRENCY,
          source: PRICE_SOURCE,
        });
      }
    }

    /* ====================================
          INSERTAR PRECIOS EN BATCH
    ==================================== */

    if (pricesToCreate.length > 0) {
      setPricesCreated = await createCardPricesInBatches(pricesToCreate);
    }

    /* ====================================
          ACUMULAR CONTADORES
    ==================================== */

    pricesCreated += setPricesCreated;
    pricesSkipped += setPricesSkipped;

    setsProcessed++;

    /* ====================================
          LOG DEL SET
    ==================================== */

    logger.info("pokemon_price_sync_set_completed", {
      currentSet,
      totalSets: sets.length,
      cards: pokemonCards.length,
      pricesCreated: setPricesCreated,
      pricesSkipped: setPricesSkipped,
      cardsMissing: setSkippedCards,
    });
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
    skippedSets,
    received,
    pricesCreated,
    pricesSkipped,
    skippedCards,
    durationSeconds,
  };

  /* ====================================
          LOG FINAL
  ==================================== */

  logger.info("pokemon_price_sync_completed", {
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
