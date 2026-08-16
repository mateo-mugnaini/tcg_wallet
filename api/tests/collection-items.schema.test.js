import { describe, expect, it } from "vitest";

import {
  collectionItemIdParamsSchema,
  collectionItemDataResponseSchema,
  createCollectionItemSchema,
  getCollectionItemsQuerySchema,
  updateCollectionItemSchema,
} from "../src/schemas/collection-items.schema.js";

const cardId = "ffc52be3-19e1-4af4-a9b2-ed32340b4c7f";
const gradingCompanyId = "37840a12-adc9-4ce2-be17-b5c58ecc1e4f";

describe("collection items schemas", () => {
  it("coerces filters and applies safe defaults", () => {
    const result = getCollectionItemsQuerySchema.parse({
      isGraded: "true",
      minGrade: "8.5",
      limit: "25",
    });

    expect(result).toMatchObject({
      isGraded: true,
      minGrade: 8.5,
      limit: 25,
      offset: 0,
      sortBy: "created_at",
      sortOrder: "DESC",
    });
  });

  it("rejects invalid boolean and pagination filters", () => {
    expect(() =>
      getCollectionItemsQuerySchema.parse({ isGraded: "yes" }),
    ).toThrow();

    expect(() =>
      getCollectionItemsQuerySchema.parse({ limit: "0" }),
    ).toThrow();
  });

  it("normalizes create defaults for an ungraded item", () => {
    const result = createCollectionItemSchema.parse({
      cardId,
      quantity: "2",
      condition: " Near Mint ",
    });

    expect(result).toEqual({
      cardId,
      quantity: 2,
      condition: "Near Mint",
      isGraded: false,
      gradingCompanyId: null,
      grade: null,
    });
  });

  it("keeps an explicit null grade as null for an ungraded item", () => {
    const result = createCollectionItemSchema.parse({
      cardId,
      quantity: 1,
      condition: "Near Mint",
      isGraded: false,
      gradingCompanyId: null,
      grade: null,
    });

    expect(result.grade).toBeNull();
  });

  it("accepts graded updates and validates item params", () => {
    expect(
      updateCollectionItemSchema.parse({
        isGraded: true,
        gradingCompanyId,
        grade: "9.5",
      }),
    ).toEqual({
      isGraded: true,
      gradingCompanyId,
      grade: 9.5,
    });

    expect(collectionItemIdParamsSchema.parse({ id: cardId })).toEqual({
      id: cardId,
    });
  });

  it("validates an enriched collection item response", () => {
    const result = collectionItemDataResponseSchema.parse({
      data: {
        id: cardId,
        user_id: gradingCompanyId,
        card_id: cardId,
        quantity: 1,
        condition: "Near Mint",
        is_graded: false,
        grading_company_id: null,
        grade: null,
        created_at: new Date(),
        updated_at: new Date(),
        card: {
          id: cardId,
          set_id: gradingCompanyId,
          external_id: "base-1",
          name: "Test Card",
          card_number: "1/10",
          rarity: "Rare",
          image_url: null,
        },
        set: {
          id: gradingCompanyId,
          tcg_id: gradingCompanyId,
          name: "Base Set",
          code: null,
          release_date: null,
        },
        tcg: { id: gradingCompanyId, name: "Pokémon" },
        grading_company: null,
      },
    });

    expect(result.data.quantity).toBe(1);
  });
});
