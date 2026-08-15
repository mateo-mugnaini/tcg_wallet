import { describe, expect, it } from "vitest";

import {
  tcgResponseSchema,
  tcgsListResponseSchema,
} from "../src/schemas/tcg.schema.js";
import {
  setResponseSchema,
  setsListResponseSchema,
} from "../src/schemas/set.schema.js";

const tcg = {
  id: "ba080cea-f75e-4d41-b0f6-4a56328778f1",
  name: "Pokémon",
  created_at: new Date(),
};

const set = {
  id: "8e72a594-fe11-46a9-9afa-14e92d0f40f0",
  tcg_id: tcg.id,
  external_id: "test-set",
  name: "Test Set",
  code: "TST",
  release_date: null,
  created_at: new Date(),
};

describe("catalog response schemas", () => {
  it("validates a TCG response and list", () => {
    tcgResponseSchema.parse(tcg);
    expect(
      tcgsListResponseSchema.parse({
        data: [tcg],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      }).data,
    ).toHaveLength(1);
  });

  it("rejects a TCG response without a valid id", () => {
    expect(() => tcgResponseSchema.parse({ ...tcg, id: "invalid" })).toThrow();
  });

  it("validates a set response and list", () => {
    setResponseSchema.parse(set);
    expect(
      setsListResponseSchema.parse({
        data: [set],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      }).data,
    ).toHaveLength(1);
  });

  it("accepts nullable set fields", () => {
    expect(
      setResponseSchema.parse({
        ...set,
        external_id: null,
        code: null,
        release_date: null,
      }).code,
    ).toBeNull();
  });
});
