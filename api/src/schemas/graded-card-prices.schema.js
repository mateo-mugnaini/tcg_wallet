import { z } from "zod";

export const gradedCardPriceCardIdParamsSchema = z.object({
  cardId: z.string().uuid(),
});

export const getGradedCardPricesQuerySchema = z.object({
  gradingCompanyId: z.string().uuid().optional(),
  grade: z.coerce.number().min(0).max(10).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortOrder: z.enum(["ASC", "DESC", "asc", "desc"]).default("DESC"),
});

export const createGradedCardPriceSchema = z.object({
  gradingCompanyId: z.string().uuid(),
  grade: z.coerce.number().min(0).max(10),
  price: z.coerce.number().min(0),
  currency: z.string().trim().min(1).max(10),
  source: z.string().trim().min(1).max(100),
});

export const getLatestGradedCardPriceQuerySchema = z.object({
  gradingCompanyId: z.string().uuid().optional(),
  grade: z.coerce.number().min(0).max(10).optional(),
});

export const getGradedCardPriceAggregationsQuerySchema = z.object({
  gradingCompanyId: z.string().uuid().optional(),
  grade: z.coerce.number().min(0).max(10).optional(),
  period: z.enum(["day", "week", "month"]).default("day"),
});

export const gradedCardPriceResponseSchema = z.object({
  id: z.string().uuid(),
  card_id: z.string().uuid(),
  grading_company_id: z.string().uuid(),
  grade: z.number(),
  price: z.number(),
  currency: z.string(),
  source: z.string(),
  recorded_at: z.string(),
});

export const gradedCardPricesListResponseSchema = z.object({
  data: z.array(gradedCardPriceResponseSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
});

export const latestGradedCardPriceResponseSchema = z.object({
  data: gradedCardPriceResponseSchema,
});

export const gradedCardPriceStatisticsResponseSchema = z.object({
  data: z.object({
    total: z.number().int(),
    minimumPrice: z.number().nullable(),
    maximumPrice: z.number().nullable(),
    averagePrice: z.number().nullable(),
  }),
});

export const gradedCardPriceVariationResponseSchema = z.object({
  data: z.object({
    currentPrice: z.number(),
    previousPrice: z.number(),
    absoluteVariation: z.number(),
    percentageVariation: z.number().nullable(),
    direction: z.enum(["up", "down", "unchanged"]),
    currency: z.string(),
    source: z.string(),
    currentGradingCompanyId: z.string().uuid(),
    previousGradingCompanyId: z.string().uuid(),
    currentGrade: z.number(),
    previousGrade: z.number(),
    currentRecordedAt: z.string(),
    previousRecordedAt: z.string(),
  }),
});

export const gradedCardPriceAggregationSchema = z.object({
  period: z.string(),
  total: z.number().int(),
  minimumPrice: z.number().nullable(),
  maximumPrice: z.number().nullable(),
  averagePrice: z.number().nullable(),
});

export const gradedCardPriceAggregationsResponseSchema = z.object({
  data: z.array(gradedCardPriceAggregationSchema),
});
