import { z } from "zod";

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
  search: z.string().trim().min(1).max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z
    .enum(["created_at", "updated_at", "name", "card_number", "rarity"])
    .default("created_at"),
  sortOrder: z.enum(["ASC", "DESC", "asc", "desc"]).default("DESC"),
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
