import { z } from "zod";
import { sortOrderSchema } from "./common.schema.js";

const cardIdParamsSchema = z.object({
  id: z.string().uuid(),
});

const cardTimestampSchema = z.union([z.string(), z.date()]);

const cardFieldsSchema = {
  setId: z.string().uuid(),
  externalId: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(255),
  cardNumber: z.string().trim().min(1).max(100),
  rarity: z.string().trim().max(100).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
};

export const getCardsQuerySchema = z.object({
  setId: z.string().uuid().optional(),
  tcgId: z.string().uuid().optional(),
  search: z.string().trim().min(1).max(100).optional(),
  rarity: z.string().trim().min(1).max(100).optional(),
  cardNumber: z.string().trim().min(1).max(100).optional(),
  externalId: z.string().trim().min(1).max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z
    .enum([
      "created_at",
      "updated_at",
      "name",
      "card_number",
      "external_id",
      "rarity",
    ])
    .default("created_at"),
  sortOrder: sortOrderSchema.default("DESC"),
});

export const createCardSchema = z.object(cardFieldsSchema);

export const updateCardSchema = z
  .object({
    setId: cardFieldsSchema.setId.optional(),
    externalId: cardFieldsSchema.externalId.optional().nullable(),
    name: cardFieldsSchema.name.optional(),
    cardNumber: cardFieldsSchema.cardNumber.optional().nullable(),
    rarity: cardFieldsSchema.rarity,
    imageUrl: cardFieldsSchema.imageUrl,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe proporcionar al menos un campo para actualizar",
  });

export const cardResponseSchema = z.object({
  id: z.string().uuid(),
  set_id: z.string().uuid(),
  external_id: z.string().nullable(),
  name: z.string(),
  card_number: z.string().nullable(),
  rarity: z.string().nullable(),
  image_url: z.string().nullable(),
  created_at: cardTimestampSchema,
  updated_at: cardTimestampSchema,
});

export const cardDataResponseSchema = z.object({
  data: cardResponseSchema,
});

const cardSetDetailSchema = z.object({
  id: z.string().uuid(),
  tcg_id: z.string().uuid(),
  external_id: z.string().nullable(),
  name: z.string(),
  code: z.string().nullable(),
  release_date: z.union([z.string(), z.date()]).nullable(),
});

const cardTcgDetailSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

const cardLatestPriceSchema = z.object({
  id: z.string().uuid(),
  card_id: z.string().uuid(),
  condition: z.string(),
  price: z.number(),
  currency: z.string(),
  source: z.string(),
  recorded_at: z.union([z.string(), z.date()]),
});

export const cardDetailResponseSchema = cardResponseSchema.extend({
  set: cardSetDetailSchema,
  tcg: cardTcgDetailSchema,
  latest_prices: z.array(cardLatestPriceSchema),
  collection: z.object({
    item_count: z.number().int().min(0),
    total_quantity: z.number().int().min(0),
    graded_quantity: z.number().int().min(0),
  }),
});

export const cardDetailDataResponseSchema = z.object({
  data: cardDetailResponseSchema,
});

export const cardsListResponseSchema = z.object({
  data: z.array(cardResponseSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
});

export { cardIdParamsSchema };
