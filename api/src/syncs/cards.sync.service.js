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

const RETRY_BASE_DELAY_MS = 1000;

/* ====================================
              UTILIDADES
==================================== */

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isRetryableStatus(status) {
  return [500, 502, 503, 504].includes(status);
}

async function getPokemonTcgCardsWithRetry(options) {
  let attempt = 0;

  while (true) {
    try {
      await sleep(API_REQUEST_DELAY_MS);

      return await getPokemonTcgCards(options);
    } catch (error) {
      attempt++;

      if (!isRetryableStatus(error.status)) {
        throw error;
      }

      if (attempt > MAX_RETRIES) {
        console.error(
          `[POKÉMON CARD SYNC] API request failed after ${MAX_RETRIES} retries`,
        );

        throw error;
      }

      const retryDelay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);

      console.warn(
        `[POKÉMON CARD SYNC] API error ${error.status} | retry=${attempt}/${MAX_RETRIES} | waiting=${retryDelay}ms`,
      );

      await sleep(retryDelay);
    }
  }
}

/* ====================================
          SINCRONIZAR CARDS
==================================== */

export async function syncPokemonCards() {
  const syncStartedAt = Date.now();

  console.log("");
  console.log("============================================================");
  console.log("[POKÉMON CARD SYNC] STARTING");
  console.log("============================================================");

  /* ====================================
          BUSCAR TCG
  ==================================== */

  const pokemonTcg = await findTcgByName(POKEMON_TCG_NAME);

  if (!pokemonTcg) {
    throw createAppError("El TCG Pokémon no existe en la base de datos", 404);
  }

  console.log(`[POKÉMON CARD SYNC] TCG: ${pokemonTcg.name}`);

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

  console.log(`[POKÉMON CARD SYNC] Sets found: ${sets.length}`);

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

      console.warn(
        `[POKÉMON CARD SYNC] SET ${currentSet}/${sets.length} | ${set.name} | SKIPPED | missing external_id`,
      );

      continue;
    }

    let setReceived = 0;
    let setCreated = 0;
    let setUpdated = 0;
    let setUnchanged = 0;
    let setSkippedCards = 0;

    console.log("");
    console.log(
      `[POKÉMON CARD SYNC] SET ${currentSet}/${sets.length} | ${set.name} | external_id=${set.external_id}`,
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
      `[POKÉMON CARD SYNC] SET ${currentSet}/${sets.length} | API cards=${totalCount} | pages=${totalPages}`,
    );

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

    console.log(
      `[POKÉMON CARD SYNC] SET ${currentSet}/${sets.length} COMPLETED | cards=${setReceived} | created=${setCreated} | updated=${setUpdated} | unchanged=${setUnchanged} | skipped=${setSkippedCards}`,
    );

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

  console.log("");
  console.log("============================================================");
  console.log("[POKÉMON CARD SYNC] COMPLETED");
  console.log("============================================================");

  console.log(
    `[POKÉMON CARD SYNC] Sets processed: ${summary.setsProcessed}/${sets.length}`,
  );

  console.log(`[POKÉMON CARD SYNC] Sets skipped: ${summary.setsSkipped}`);

  console.log(`[POKÉMON CARD SYNC] Cards received: ${summary.received}`);

  console.log(`[POKÉMON CARD SYNC] Cards created: ${summary.created}`);

  console.log(`[POKÉMON CARD SYNC] Cards updated: ${summary.updated}`);

  console.log(`[POKÉMON CARD SYNC] Cards unchanged: ${summary.unchanged}`);

  console.log(`[POKÉMON CARD SYNC] Cards skipped: ${summary.skipped}`);

  console.log(`[POKÉMON CARD SYNC] Duration: ${summary.durationSeconds}s`);

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
