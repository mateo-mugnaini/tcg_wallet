import { z } from "zod";

const syncTcgSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

const syncCounterSchema = z.number().int().min(0);

export const pokemonSetsSyncResponseSchema = z.object({
  tcg: syncTcgSchema,
  summary: z.object({
    received: syncCounterSchema,
    created: syncCounterSchema,
    updated: syncCounterSchema,
    unchanged: syncCounterSchema,
    skipped: syncCounterSchema,
    pagesProcessed: syncCounterSchema,
    stoppedAtExisting: z.boolean(),
    durationSeconds: syncCounterSchema,
  }),
});

export const pokemonCardsSyncResponseSchema = z.object({
  tcg: syncTcgSchema,
  summary: z.object({
    setsProcessed: syncCounterSchema,
    setsSkipped: syncCounterSchema,
    received: syncCounterSchema,
    created: syncCounterSchema,
    updated: syncCounterSchema,
    unchanged: syncCounterSchema,
    skipped: syncCounterSchema,
    durationSeconds: syncCounterSchema,
  }),
});

export const pokemonCardPricesSyncResponseSchema = z.object({
  tcg: syncTcgSchema,
  summary: z.object({
    setsProcessed: syncCounterSchema,
    skippedSets: syncCounterSchema,
    received: syncCounterSchema,
    pricesCreated: syncCounterSchema,
    pricesSkipped: syncCounterSchema,
    skippedCards: syncCounterSchema,
    durationSeconds: syncCounterSchema,
  }),
});

export const syncPipelineResponseSchema = z.object({
  status: z.literal("completed"),
  durationSeconds: syncCounterSchema,
  sets: pokemonSetsSyncResponseSchema,
  cards: pokemonCardsSyncResponseSchema,
  prices: pokemonCardPricesSyncResponseSchema,
});
