import { beforeEach, describe, expect, it, vi } from "vitest";

const repositoryMocks = vi.hoisted(() => ({
  findCardPrices: vi.fn(),
  countCardPrices: vi.fn(),
  findLatestCardPrice: vi.fn(),
  findLatestCardPrices: vi.fn(),
  createCardPrice: vi.fn(),
  getCardPriceStats: vi.fn(),
  getCardPriceAggregations: vi.fn(),
  findCardById: vi.fn(),
}));

vi.mock("../src/repositories/cards-prices.repository.js", () => ({
  findCardPrices: repositoryMocks.findCardPrices,
  countCardPrices: repositoryMocks.countCardPrices,
  findLatestCardPrice: repositoryMocks.findLatestCardPrice,
  findLatestCardPrices: repositoryMocks.findLatestCardPrices,
  createCardPrice: repositoryMocks.createCardPrice,
  getCardPriceStats: repositoryMocks.getCardPriceStats,
  getCardPriceAggregations: repositoryMocks.getCardPriceAggregations,
}));

vi.mock("../src/repositories/cards.repository.js", () => ({
  findCardById: repositoryMocks.findCardById,
}));

import {
  getCardPriceStatistics,
  getCardPriceVariation,
  getCardPrices,
  registerCardPrice,
} from "../src/services/cards-prices.service.js";

const cardId = "ffc52be3-19e1-4af4-a9b2-ed32340b4c7f";

describe("cards prices service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repositoryMocks.findCardById.mockResolvedValue({ id: cardId });
  });

  it("normalizes prices and calculates pagination", async () => {
    repositoryMocks.findCardPrices.mockResolvedValue([
      { id: "price-1", price: "12.50" },
    ]);
    repositoryMocks.countCardPrices.mockResolvedValue(21);

    const result = await getCardPrices({
      cardId,
      page: 2,
      limit: 10,
      sortOrder: "ASC",
    });

    expect(result.data[0].price).toBe(12.5);
    expect(result.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 21,
      totalPages: 3,
    });
    expect(repositoryMocks.findCardPrices).toHaveBeenCalledWith(
      expect.objectContaining({ cardId, limit: 10, offset: 10 }),
    );
  });

  it("rejects price registration for a missing card", async () => {
    repositoryMocks.findCardById.mockResolvedValue(null);

    await expect(
      registerCardPrice({
        cardId,
        condition: "Near Mint",
        price: 10,
        currency: "USD",
        source: "test",
      }),
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(repositoryMocks.createCardPrice).not.toHaveBeenCalled();
  });

  it("rejects negative prices before persistence", async () => {
    await expect(
      registerCardPrice({
        cardId,
        condition: "Near Mint",
        price: -1,
        currency: "USD",
        source: "test",
      }),
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(repositoryMocks.createCardPrice).not.toHaveBeenCalled();
  });

  it("calculates upward price variation from the latest two snapshots", async () => {
    repositoryMocks.findLatestCardPrices.mockResolvedValue([
      {
        price: "12",
        currency: "USD",
        source: "pokemon-tcg",
        condition: "Near Mint",
        recorded_at: "2026-08-16T00:00:00.000Z",
      },
      {
        price: "10",
        currency: "USD",
        source: "pokemon-tcg",
        condition: "Near Mint",
        recorded_at: "2026-08-15T00:00:00.000Z",
      },
    ]);

    const result = await getCardPriceVariation({ cardId });

    expect(result).toMatchObject({
      currentPrice: 12,
      previousPrice: 10,
      absoluteVariation: 2,
      percentageVariation: 20,
      direction: "up",
    });
  });

  it("normalizes statistics returned as PostgreSQL numerics", async () => {
    repositoryMocks.getCardPriceStats.mockResolvedValue({
      total: "3",
      minimum_price: "8.10",
      maximum_price: "12.50",
      average_price: "10.30",
    });

    await expect(getCardPriceStatistics({ cardId })).resolves.toEqual({
      total: 3,
      minimumPrice: 8.1,
      maximumPrice: 12.5,
      averagePrice: 10.3,
    });
  });
});
