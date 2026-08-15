import { z } from "zod";

const cardIdParamsSchema = z.object({
  id: z.string().uuid(),
});

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

export { cardIdParamsSchema };
