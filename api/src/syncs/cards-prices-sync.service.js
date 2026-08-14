import { findCardByExternalId } from "../repositories/cards.repository.js";

import {
  createCardPrice,
  findCardPrice,
} from "../repositories/cards-prices.repository.js";

import { findSets } from "../repositories/sets.repository.js";

import { getPokemonTcgCards } from "../integrations/pokemon-tcg/pokemon-tcg.client.js";

import { findTcgByName } from "../repositories/tcg.repository.js";

import { createAppError } from "../errors/app.errors.js";

/* ====================================
        CONFIGURACIÓN SYNC
==================================== */

const POKEMON_TCG_NAME = "Pókemon";

const POKEMON_TCG_PAGE_SIZE = 250;

const PRICE_SOURCE = "pokemon-tcg";

const PRICE_CURRENCY = "USD";

const MAX_RETRIES = 15;

const RETRY_BASE_DELAY = 500;

/* ====================================
              DELAY
==================================== */

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
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

      if (attempt === MAX_RETRIES) {
        console.error(
          `[POKÉMON PRICE SYNC] API request failed after ${MAX_RETRIES} retries`,
        );

        throw error;
      }

      const waitTime = RETRY_BASE_DELAY * attempt;

      console.warn(
        `[POKÉMON PRICE SYNC] API error ${error.status ?? "unknown"} | retry=${attempt}/${MAX_RETRIES} | waiting=${waitTime}ms`,
      );

      await delay(waitTime);
    }
  }

  throw lastError;
}

/* ====================================
        SINCRONIZAR PRECIOS
==================================== */

export async function syncPokemonCardPrices() {
  const syncStartedAt = Date.now();

  console.log("");
  console.log("============================================================");
  console.log("[POKÉMON PRICE SYNC] STARTING");
  console.log("============================================================");

  /* ====================================
          BUSCAR TCG
  ==================================== */

  const pokemonTcg = await findTcgByName(POKEMON_TCG_NAME);

  if (!pokemonTcg) {
    throw createAppError("El TCG Pokémon no existe en la base de datos", 404);
  }

  console.log(`[POKÉMON PRICE SYNC] TCG: ${pokemonTcg.name}`);

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

  console.log(`[POKÉMON PRICE SYNC] Sets found: ${sets.length}`);

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

      console.warn(
        `[POKÉMON PRICE SYNC] SET ${currentSet}/${sets.length} | ${set.name} | SKIPPED | missing external_id`,
      );

      continue;
    }

    let setReceived = 0;
    let setPricesCreated = 0;
    let setPricesSkipped = 0;
    let setSkippedCards = 0;

    console.log("");
    console.log(
      `[POKÉMON PRICE SYNC] SET ${currentSet}/${sets.length} | ${set.name} | external_id=${set.external_id}`,
    );

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

    console.log(
      `[POKÉMON PRICE SYNC] SET ${currentSet}/${sets.length} | API cards=${totalCount} | pages=${totalPages}`,
    );

    /* ====================================
          PROCESAR PRIMERA PÁGINA
    ==================================== */

    for (const pokemonCard of firstPageData) {
      const result = await syncPokemonCardPrice(pokemonCard, set.id);

      received++;
      setReceived++;

      if (result.cardSkipped) {
        skippedCards++;
        setSkippedCards++;
      }

      pricesCreated += result.pricesCreated;
      setPricesCreated += result.pricesCreated;

      pricesSkipped += result.pricesSkipped;
      setPricesSkipped += result.pricesSkipped;
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
        const result = await syncPokemonCardPrice(pokemonCard, set.id);

        received++;
        setReceived++;

        if (result.cardSkipped) {
          skippedCards++;
          setSkippedCards++;
        }

        pricesCreated += result.pricesCreated;
        setPricesCreated += result.pricesCreated;

        pricesSkipped += result.pricesSkipped;
        setPricesSkipped += result.pricesSkipped;
      }
    }

    setsProcessed++;

    /* ====================================
          LOG DEL SET
    ==================================== */

    console.log(
      `[POKÉMON PRICE SYNC] SET ${currentSet}/${sets.length} COMPLETED | cards=${setReceived} | pricesCreated=${setPricesCreated} | pricesSkipped=${setPricesSkipped} | cardsMissing=${setSkippedCards}`,
    );
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

  console.log("");
  console.log("============================================================");
  console.log("[POKÉMON PRICE SYNC] COMPLETED");
  console.log("============================================================");

  console.log(
    `[POKÉMON PRICE SYNC] Sets processed: ${summary.setsProcessed}/${sets.length}`,
  );

  console.log(`[POKÉMON PRICE SYNC] Sets skipped: ${summary.skippedSets}`);

  console.log(`[POKÉMON PRICE SYNC] Cards received: ${summary.received}`);

  console.log(`[POKÉMON PRICE SYNC] Prices created: ${summary.pricesCreated}`);

  console.log(`[POKÉMON PRICE SYNC] Prices skipped: ${summary.pricesSkipped}`);

  console.log(`[POKÉMON PRICE SYNC] Cards skipped: ${summary.skippedCards}`);

  console.log(`[POKÉMON PRICE SYNC] Duration: ${summary.durationSeconds}s`);

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

/* ====================================
        SINCRONIZAR PRECIO CARD
==================================== */

async function syncPokemonCardPrice(pokemonCard, setId) {
  const externalId = pokemonCard.id;

  /* ====================================
          VALIDACIÓN
  ==================================== */

  if (!externalId || !pokemonCard.name) {
    return {
      cardSkipped: true,
      pricesCreated: 0,
      pricesSkipped: 0,
    };
  }

  /* ====================================
          BUSCAR CARD
  ==================================== */

  const card = await findCardByExternalId(setId, externalId);

  /*
   * La Card debería existir porque
   * el Card Sync se ejecutó antes.
   */

  if (!card) {
    return {
      cardSkipped: true,
      pricesCreated: 0,
      pricesSkipped: 0,
    };
  }

  /* ====================================
          OBTENER PRECIOS
  ==================================== */

  const prices = pokemonCard.tcgplayer?.prices;

  if (!prices || typeof prices !== "object") {
    return {
      cardSkipped: false,
      pricesCreated: 0,
      pricesSkipped: 1,
    };
  }

  let pricesCreated = 0;
  let pricesSkipped = 0;

  /* ====================================
          CONDITIONS
  ==================================== */

  for (const [condition, priceData] of Object.entries(prices)) {
    /* ====================================
          VALIDAR PRICE DATA
    ==================================== */

    if (!priceData || typeof priceData !== "object") {
      pricesSkipped++;
      continue;
    }

    /* ====================================
          MARKET PRICE
    ==================================== */

    const marketPrice = priceData.market;

    if (marketPrice === undefined || marketPrice === null) {
      pricesSkipped++;
      continue;
    }

    const numericPrice = Number(marketPrice);

    if (!Number.isFinite(numericPrice)) {
      pricesSkipped++;
      continue;
    }

    /* ====================================
          BUSCAR PRECIO EXISTENTE
    ==================================== */

    const existingPrice = await findCardPrice({
      cardId: card.id,
      condition,
      source: PRICE_SOURCE,
    });

    /* ====================================
          YA EXISTE
    ==================================== */

    if (existingPrice) {
      pricesSkipped++;

      continue;
    }

    /* ====================================
          CREAR
    ==================================== */

    await createCardPrice({
      cardId: card.id,
      condition,
      price: numericPrice,
      currency: PRICE_CURRENCY,
      source: PRICE_SOURCE,
    });

    pricesCreated++;
  }

  return {
    cardSkipped: false,
    pricesCreated,
    pricesSkipped,
  };
}
