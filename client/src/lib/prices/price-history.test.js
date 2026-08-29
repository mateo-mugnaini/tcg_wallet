import { describe, expect, it } from "vitest";
import { getAllPriceHistory, getVisiblePriceHistory } from "./price-history.js";

const now = Date.parse("2026-08-16T00:00:00.000Z");

describe("getVisiblePriceHistory", () => {
  it("normalizes, removes invalid dates and sorts the complete history", () => {
    const result = getAllPriceHistory([
      { period: "2026-07-01", averagePrice: 20 },
      { period: "not-a-date", averagePrice: 99 },
      { period: "2026-01-01", averagePrice: 10 },
    ]);

    expect(result.map((item) => item.averagePrice)).toEqual([10, 20]);
  });

  it("keeps only points from the last year when they exist", () => {
    const result = getVisiblePriceHistory([
      { period: "2024-01-01", averagePrice: 10 },
      { period: "2026-01-01", averagePrice: 20 },
      { period: "2026-07-01", averagePrice: 30 },
    ], now);

    expect(result.isFallback).toBe(false);
    expect(result.data.map((item) => item.averagePrice)).toEqual([20, 30]);
  });

  it("shows the latest historical point when the year has no data", () => {
    const result = getVisiblePriceHistory([
      { period: "2023-01-01", averagePrice: 10 },
      { period: "2024-01-01", averagePrice: 20 },
    ], now);

    expect(result.isFallback).toBe(true);
    expect(result.data.map((item) => item.averagePrice)).toEqual([20]);
  });

  it("sorts points chronologically and ignores invalid dates", () => {
    const result = getVisiblePriceHistory([
      { period: "2026-07-01", averagePrice: 30 },
      { period: "not-a-date", averagePrice: 99 },
      { period: "2026-01-01", averagePrice: 20 },
    ], now);

    expect(result.data.map((item) => item.averagePrice)).toEqual([20, 30]);
  });

  it("returns no points when the aggregation history is empty", () => {
    expect(getVisiblePriceHistory([], now)).toEqual({ data: [], isFallback: false });
    expect(getVisiblePriceHistory(null, now)).toEqual({ data: [], isFallback: false });
  });
});
