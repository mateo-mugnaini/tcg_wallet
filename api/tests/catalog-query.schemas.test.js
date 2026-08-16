import { describe, expect, it } from "vitest";

import { getTcgsQuerySchema } from "../src/schemas/tcg.schema.js";
import { getSetsQuerySchema } from "../src/schemas/set.schema.js";
import { getCardsQuerySchema } from "../src/schemas/cards.schema.js";
import { getUsersQuerySchema } from "../src/schemas/user.schema.js";

const tcgId = "ba080cea-f75e-4d41-b0f6-4a56328778f1";

describe("catalog query contracts", () => {
  it("normalizes case and whitespace in sort order for TCGs", () => {
    expect(
      getTcgsQuerySchema.parse({ sortOrder: " asc " }).sortOrder,
    ).toBe("ASC");
  });

  it("supports set search, TCG filtering and normalized descending order", () => {
    expect(
      getSetsQuerySchema.parse({
        tcgId,
        search: "  base  ",
        page: "2",
        limit: "50",
        sortBy: "release_date",
        sortOrder: "desc",
      }),
    ).toEqual({
      tcgId,
      search: "base",
      page: 2,
      limit: 50,
      sortBy: "release_date",
      sortOrder: "DESC",
    });
  });

  it("applies the same canonical value to cards and users", () => {
    expect(getCardsQuerySchema.parse({ sortOrder: "asc" }).sortOrder).toBe(
      "ASC",
    );
    expect(getUsersQuerySchema.parse({ sortOrder: "DESC" }).sortOrder).toBe(
      "DESC",
    );
  });

  it("rejects unsupported sort orders", () => {
    expect(() => getTcgsQuerySchema.parse({ sortOrder: "random" })).toThrow();
    expect(() => getSetsQuerySchema.parse({ sortOrder: "random" })).toThrow();
  });
});
