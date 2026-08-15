import { describe, expect, it } from "vitest";

import {
  cardIdParamsSchema,
  createCardSchema,
  getCardsQuerySchema,
  updateCardSchema,
} from "../src/schemas/cards.schema.js";

const setId = "8e72a594-fe11-46a9-9afa-14e92d0f40f0";
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
      sortOrder: "asc",
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
});
