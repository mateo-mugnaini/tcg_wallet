import { syncPokemonSets } from "./sets.sync.service.js";
import { syncPokemonCards } from "./cards.sync.service.js";
import { syncPokemonCardPrices } from "./cards-prices-sync.service.js";

/* ====================================
        SYNC PIPELINE
==================================== */

export async function syncPokemonPipeline() {
  const startedAt = Date.now();

  console.log("");
  console.log("============================================================");
  console.log("[POKÉMON SYNC PIPELINE] STARTING");
  console.log("============================================================");

  try {
    /* ====================================
            1. SYNC SETS
    ==================================== */

    console.log("");
    console.log("[POKÉMON SYNC PIPELINE] STEP 1/3 | SETS");

    const setsResult = await syncPokemonSets();

    /* ====================================
            2. SYNC CARDS
    ==================================== */

    console.log("");
    console.log("[POKÉMON SYNC PIPELINE] STEP 2/3 | CARDS");

    const cardsResult = await syncPokemonCards();

    /* ====================================
            3. SYNC PRICES
    ==================================== */

    console.log("");
    console.log("[POKÉMON SYNC PIPELINE] STEP 3/3 | PRICES");

    const pricesResult = await syncPokemonCardPrices();

    /* ====================================
            FINALIZAR
    ==================================== */

    const durationMs = Date.now() - startedAt;
    const durationSeconds = Math.round(durationMs / 1000);

    console.log("");
    console.log("============================================================");
    console.log("[POKÉMON SYNC PIPELINE] COMPLETED");
    console.log("============================================================");

    console.log(`[POKÉMON SYNC PIPELINE] Duration: ${durationSeconds}s`);

    console.log("============================================================");
    console.log("");

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

    console.error("");
    console.error(
      "============================================================",
    );
    console.error("[POKÉMON SYNC PIPELINE] FAILED");
    console.error(
      "============================================================",
    );

    console.error(`[POKÉMON SYNC PIPELINE] Duration: ${durationSeconds}s`);

    console.error(`[POKÉMON SYNC PIPELINE] Error: ${error.message}`);

    console.error(
      "============================================================",
    );
    console.error("");

    throw error;
  }
}
