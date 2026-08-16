import { syncPokemonSets } from "./sets.sync.service.js";
import { syncPokemonCards } from "./cards.sync.service.js";
import { syncPokemonCardPrices } from "./cards-prices-sync.service.js";
import { logger } from "../utils/logger.js";

/* ====================================
        SYNC PIPELINE
==================================== */

export async function syncPokemonPipeline() {
  const startedAt = Date.now();

  logger.info("pokemon_sync_pipeline_started");

  try {
    /* ====================================
            1. SYNC SETS
    ==================================== */

    logger.info("pokemon_sync_pipeline_step_started", { step: "sets" });

    const setsResult = await syncPokemonSets();

    /* ====================================
            2. SYNC CARDS
    ==================================== */

    logger.info("pokemon_sync_pipeline_step_started", { step: "cards" });

    const cardsResult = await syncPokemonCards();

    /* ====================================
            3. SYNC PRICES
    ==================================== */

    logger.info("pokemon_sync_pipeline_step_started", { step: "prices" });

    const pricesResult = await syncPokemonCardPrices();

    /* ====================================
            FINALIZAR
    ==================================== */

    const durationMs = Date.now() - startedAt;
    const durationSeconds = Math.round(durationMs / 1000);

    logger.info("pokemon_sync_pipeline_completed", {
      durationSeconds,
      sets: setsResult.summary,
      cards: cardsResult.summary,
      prices: pricesResult.summary,
    });

    return {
      status: "completed",

      durationSeconds,

      sets: setsResult,

      cards: cardsResult,

      prices: pricesResult,
    };
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const durationSeconds = Math.round(durationMs / 1000);

    logger.error("pokemon_sync_pipeline_failed", {
      durationSeconds,
      message: error.message,
      code: error.code,
    });

    throw error;
  }
}
