import { z } from "zod";

/* ====================================
        CARD ID PARAM
==================================== */

export const cardPriceCardIdParamsSchema = z.object({
  cardId: z.string().uuid(),
});

/* ====================================
        LISTAR CARD PRICES
==================================== */

export const getCardPricesQuerySchema = z.object({
  source: z.string().trim().min(1).max(100).optional(),

  condition: z.string().trim().min(1).max(100).optional(),

  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(20),

  sortOrder: z.enum(["ASC", "DESC", "asc", "desc"]).default("DESC"),
});

/* ====================================
        ÚLTIMO CARD PRICE
==================================== */

export const getLatestCardPriceQuerySchema = z.object({
  source: z.string().trim().min(1).max(100).optional(),

  condition: z.string().trim().min(1).max(100).optional(),
});

/* ====================================
        CREAR CARD PRICE
==================================== */

export const createCardPriceSchema = z.object({
  condition: z.string().trim().min(1).max(100),

  price: z.coerce.number().min(0),

  currency: z.string().trim().min(1).max(10),

  source: z.string().trim().min(1).max(100),
});

/* ====================================
        AGREGACIONES CARD PRICES
==================================== */

export const getCardPriceAggregationsQuerySchema = z.object({
  source: z.string().trim().min(1).max(100).optional(),

  condition: z.string().trim().min(1).max(100).optional(),

  period: z.enum(["day", "week", "month"]).default("day"),
});

/* ====================================
        CARD PRICE RESPONSE
==================================== */

export const cardPriceResponseSchema = z.object({
  id: z.string().uuid(),
  card_id: z.string().uuid(),
  condition: z.string(),
  price: z.number(),
  currency: z.string(),
  source: z.string(),
  recorded_at: z.string(),
});

/* ====================================
        CARD PRICES LIST RESPONSE
==================================== */

export const cardPricesListResponseSchema = z.object({
  data: z.array(cardPriceResponseSchema),

  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
});

/* ====================================
        LATEST CARD PRICE RESPONSE
==================================== */

export const latestCardPriceResponseSchema = z.object({
  data: cardPriceResponseSchema,
});

/* ====================================
        CARD PRICE STATISTICS RESPONSE
==================================== */

export const cardPriceStatisticsResponseSchema = z.object({
  data: z.object({
    total: z.number().int(),
    minimumPrice: z.number().nullable(),
    maximumPrice: z.number().nullable(),
    averagePrice: z.number().nullable(),
  }),
});

/* ====================================
        CARD PRICE VARIATION RESPONSE
==================================== */

export const cardPriceVariationResponseSchema = z.object({
  data: z.object({
    currentPrice: z.number(),
    previousPrice: z.number(),
    absoluteVariation: z.number(),
    percentageVariation: z.number().nullable(),
    direction: z.enum(["up", "down", "unchanged"]),
    currency: z.string(),
    source: z.string(),
    condition: z.string(),
    currentRecordedAt: z.string(),
    previousRecordedAt: z.string(),
  }),
});

/* ====================================
        CARD PRICE AGGREGATION
==================================== */

export const cardPriceAggregationSchema = z.object({
  period: z.string(),
  total: z.number().int(),
  minimumPrice: z.number().nullable(),
  maximumPrice: z.number().nullable(),
  averagePrice: z.number().nullable(),
});

/* ====================================
        CARD PRICE AGGREGATIONS RESPONSE
==================================== */

export const cardPriceAggregationsResponseSchema = z.object({
  data: z.array(cardPriceAggregationSchema),
});

/* ==================================== CARD PRICES SYNC RESPONSE ==================================== */ export const cardPricesSyncResponseSchema =
  z.object({
    tcg: z.object({ id: z.string().uuid(), name: z.string() }),
    summary: z.object({
      setsProcessed: z.number().int().min(0),
      skippedSets: z.number().int().min(0),
      received: z.number().int().min(0),
      pricesCreated: z.number().int().min(0),
      pricesSkipped: z.number().int().min(0),
      skippedCards: z.number().int().min(0),
      durationSeconds: z.number().int().min(0),
    }),
  });
