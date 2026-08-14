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
