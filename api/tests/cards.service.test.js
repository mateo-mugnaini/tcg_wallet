import { beforeEach, describe, expect, it, vi } from "vitest";

const repositoryMocks = vi.hoisted(() => ({
  findCards: vi.fn(),
  countCards: vi.fn(),
  createCard: vi.fn(),
  updateCard: vi.fn(),
  deleteCard: vi.fn(),
  findCardById: vi.fn(),
  findCardDetailsById: vi.fn(),
  findCardByName: vi.fn(),
  findCardByExternalId: vi.fn(),
  findSetById: vi.fn(),
}));

vi.mock("../src/repositories/cards.repository.js", () => ({
  findCards: repositoryMocks.findCards,
  countCards: repositoryMocks.countCards,
  createCard: repositoryMocks.createCard,
  updateCard: repositoryMocks.updateCard,
  deleteCard: repositoryMocks.deleteCard,
  findCardById: repositoryMocks.findCardById,
  findCardDetailsById: repositoryMocks.findCardDetailsById,
  findCardByName: repositoryMocks.findCardByName,
  findCardByExternalId: repositoryMocks.findCardByExternalId,
}));

vi.mock("../src/repositories/sets.repository.js", () => ({
  findSetById: repositoryMocks.findSetById,
}));

import {
  editCard,
  getCardById,
  getCards,
  registerCard,
} from "../src/services/cards.service.js";

const cardId = "ffc52be3-19e1-4af4-a9b2-ed32340b4c7f";
const setId = "8e72a594-fe11-46a9-9afa-14e92d0f40f0";
const tcgId = "ba080cea-f75e-4d41-b0f6-4a56328778f1";

describe("cards service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repositoryMocks.findSetById.mockResolvedValue({ id: setId });
  });

  it("calculates pagination and forwards catalog filters to repositories", async () => {
    repositoryMocks.findCards.mockResolvedValue([{ id: cardId }]);
    repositoryMocks.countCards.mockResolvedValue(21);

    const result = await getCards({
      setId,
      tcgId,
      search: "Charizard",
      rarity: "Rare",
      cardNumber: "4/102",
      externalId: "base4",
      page: 2,
      limit: 10,
      sortBy: "name",
      sortOrder: "ASC",
    });

    expect(repositoryMocks.findCards).toHaveBeenCalledWith({
      setId,
      tcgId,
      search: "Charizard",
      rarity: "Rare",
      cardNumber: "4/102",
      externalId: "base4",
      limit: 10,
      offset: 10,
      sortBy: "name",
      sortOrder: "ASC",
    });
    expect(result.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 21,
      totalPages: 3,
    });
  });

  it("converts PostgreSQL numeric prices before returning card details", async () => {
    repositoryMocks.findCardDetailsById.mockResolvedValue({
      id: cardId,
      latest_prices: [{ price: "12.50" }],
    });

    const result = await getCardById(cardId, "user-id");

    expect(result.latest_prices[0].price).toBe(12.5);
  });

  it("rejects a card when its set does not exist", async () => {
    repositoryMocks.findSetById.mockResolvedValue(null);

    await expect(
      registerCard({
        setId,
        externalId: "base4",
        name: "Charizard",
        cardNumber: "4/102",
      }),
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(repositoryMocks.createCard).not.toHaveBeenCalled();
  });

  it("rejects duplicate cards by external id within the set", async () => {
    repositoryMocks.findCardByExternalId.mockResolvedValue({ id: "existing" });

    await expect(
      registerCard({
        setId,
        externalId: "base4",
        name: "Charizard",
        cardNumber: "4/102",
      }),
    ).rejects.toMatchObject({ statusCode: 409 });

    expect(repositoryMocks.findCardByName).not.toHaveBeenCalled();
  });

  it("updates an existing card after validating its existence", async () => {
    repositoryMocks.findCardById.mockResolvedValue({ id: cardId, set_id: setId });
    repositoryMocks.updateCard.mockResolvedValue({ id: cardId, rarity: "Rare" });

    const result = await editCard(cardId, { rarity: "Rare" });

    expect(repositoryMocks.updateCard).toHaveBeenCalledWith(cardId, {
      setId: undefined,
      externalId: undefined,
      name: undefined,
      cardNumber: undefined,
      rarity: "Rare",
      imageUrl: undefined,
    });
    expect(result).toEqual({ id: cardId, rarity: "Rare" });
  });
});
