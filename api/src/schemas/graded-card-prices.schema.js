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
