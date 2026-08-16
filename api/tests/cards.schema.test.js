import { describe, expect, it } from "vitest";

import {
  cardIdParamsSchema,
  cardDetailDataResponseSchema,
  createCardSchema,
  getCardsQuerySchema,
  updateCardSchema,
} from "../src/schemas/cards.schema.js";

const setId = "8e72a594-fe11-46a9-9afa-14e92d0f40f0";
const tcgId = "ba080cea-f75e-4d41-b0f6-4a56328778f1";
const cardId = "ffc52be3-19e1-4af4-a9b2-ed32340b4c7f";

describe("cards schemas", () => {
  it("coerces list pagination and keeps the safe sort whitelist", () => {
    const result = getCardsQuerySchema.parse({
      setId,
      search: " Charizard ",
      page: "2",
      limit: "25",
      sortBy: "name",
      sortOrder: "asc",
    });

    expect(result).toEqual({
      setId,
      search: "Charizard",
      page: 2,
      limit: 25,
      sortBy: "name",
      sortOrder: "ASC",
    });
  });

  it("accepts the advanced catalog filters", () => {
    const result = getCardsQuerySchema.parse({
      tcgId,
      rarity: "Rare",
      cardNumber: "4/102",
      externalId: "base4",
    });

    expect(result).toMatchObject({
      tcgId,
      rarity: "Rare",
      cardNumber: "4/102",
      externalId: "base4",
    });
  });

  it("validates required card fields", () => {
    const result = createCardSchema.parse({
      setId,
      externalId: "base-1",
      name: "Test Card",
      cardNumber: "1/10",
      rarity: null,
      imageUrl: "https://example.com/card.png",
    });

    expect(result.name).toBe("Test Card");
    expect(() => createCardSchema.parse({ name: "Missing fields" })).toThrow();
  });

  it("requires at least one update field", () => {
    expect(updateCardSchema.parse({ rarity: "Rare" })).toEqual({
      rarity: "Rare",
    });
    expect(() => updateCardSchema.parse({})).toThrow();
  });

  it("validates card id params", () => {
    expect(cardIdParamsSchema.parse({ id: cardId })).toEqual({ id: cardId });
    expect(() => cardIdParamsSchema.parse({ id: "invalid" })).toThrow();
  });

  it("validates the enriched card detail contract", () => {
    expect(
      cardDetailDataResponseSchema.parse({
        data: {
          id: cardId,
          set_id: setId,
          external_id: "base4",
          name: "Charizard",
          card_number: "4/102",
          rarity: "Rare",
          image_url: null,
          created_at: new Date(),
          updated_at: new Date(),
          set: {
            id: setId,
            tcg_id: tcgId,
            external_id: "base-set",
            name: "Base Set",
            code: "BS",
            release_date: null,
          },
          tcg: { id: tcgId, name: "Pokémon" },
          latest_prices: [],
          collection: {
            item_count: 0,
            total_quantity: 0,
            graded_quantity: 0,
          },
        },
      }).data.collection.total_quantity,
    ).toBe(0);
  });
});
