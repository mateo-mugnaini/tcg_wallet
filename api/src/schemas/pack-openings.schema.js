import { z } from "zod";

export const openingSetParamsSchema = z.object({
  id: z.string().uuid(),
});

export const openPacksSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(10).default(1),
});

const openingCardSchema = z.object({
  id: z.string().uuid(),
  opening_id: z.string().uuid(),
  card_id: z.string().uuid(),
  pack_number: z.number().int().min(1).max(10),
  slot_number: z.number().int().min(1).max(5),
  rarity_key: z.string(),
  card: z.object({
    id: z.string().uuid(),
    set_id: z.string().uuid(),
    external_id: z.string().nullable(),
    name: z.string(),
    card_number: z.string().nullable(),
    rarity: z.string().nullable(),
    image_url: z.string().nullable(),
  }),
});

export const openingResponseSchema = z.object({
  data: z.object({
    opening_id: z.string().uuid(),
    set_id: z.string().uuid(),
    pack_quantity: z.number().int().min(1).max(10),
    cards_per_pack: z.literal(5),
    total_cards: z.number().int().min(5).max(50),
    opened_at: z.string(),
    next_open_at: z.string(),
    cards: z.array(openingCardSchema),
  }),
});

export const openingStatusResponseSchema = z.object({
  data: z.object({
    can_open: z.boolean(),
    next_open_at: z.string().nullable(),
  }),
});

const pokedexCardSchema = z.object({
  id: z.string().uuid(),
  set_id: z.string().uuid(),
  external_id: z.string().nullable(),
  name: z.string(),
  card_number: z.string().nullable(),
  rarity: z.string().nullable(),
  image_url: z.string().nullable(),
  rarity_key: z.string().optional(),
  owned_quantity: z.number().int().nonnegative(),
  owned: z.boolean(),
});

export const pokedexResponseSchema = z.object({
  data: z.object({
    set: z.object({
      id: z.string().uuid(),
      tcg_id: z.string().uuid(),
      name: z.string(),
      code: z.string().nullable(),
    }),
    summary: z.object({
      total_cards: z.number().int().nonnegative(),
      owned_cards: z.number().int().nonnegative(),
      missing_cards: z.number().int().nonnegative(),
      completion_percentage: z.number().min(0).max(100),
      cards_per_pack: z.literal(5),
    }),
    data: z.array(pokedexCardSchema),
  }),
});
