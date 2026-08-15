import { describe, expect, it } from "vitest";

import {
  createGradedCardPriceSchema,
  gradedCardPricesImportResponseSchema,
  importGradedCardPricesSchema,
} from "../src/schemas/graded-card-prices.schema.js";
import { importGradedCardPrices } from "../src/services/graded-card-prices-import.service.js";

const cardId = "ffc52be3-19e1-4af4-a9b2-ed32340b4c7f";
const gradingCompanyId = "37840a12-adc9-4ce2-be17-b5c58ecc1e4f";

describe("graded card prices contracts", () => {
  it("normalizes numeric values and accepts recordedAt in batch imports", () => {
    const result = importGradedCardPricesSchema.parse({
      prices: [
        {
          cardId,
          gradingCompanyId,
          grade: "9.5",
          price: "150.25",
          currency: " USD ",
          source: "provider-test",
          recordedAt: "2026-08-14T12:00:00.000Z",
        },
      ],
    });

    expect(result.prices[0]).toMatchObject({
      cardId,
      gradingCompanyId,
      grade: 9.5,
      price: 150.25,
      currency: "USD",
      source: "provider-test",
    });
  });

  it("rejects invalid grade, price and timestamp values", () => {
    expect(() =>
      createGradedCardPriceSchema.parse({
        gradingCompanyId,
        grade: 11,
        price: -1,
        currency: "USD",
        source: "provider-test",
      }),
    ).toThrow();

    expect(() =>
      importGradedCardPricesSchema.parse({
        prices: [
          {
            cardId,
            gradingCompanyId,
            grade: 9,
            price: 100,
            currency: "USD",
            source: "provider-test",
            recordedAt: "not-a-date",
          },
        ],
      }),
    ).toThrow();
  });

  it("rejects an empty import before accessing the database", async () => {
    await expect(importGradedCardPrices([])).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("validates the import response contract", () => {
    expect(
      gradedCardPricesImportResponseSchema.parse({
        summary: { received: 2, created: 2 },
      }),
    ).toEqual({
      summary: { received: 2, created: 2 },
    });
  });
});
