import { describe, expect, it } from "vitest";

import {
  gradingCompaniesListResponseSchema,
  gradingCompanyMutationResponseSchema,
} from "../src/schemas/grading-companies.schema.js";
import {
  loginResponseSchema,
  refreshResponseSchema,
} from "../src/schemas/auth.schema.js";
import {
  userDataResponseSchema,
  userDeleteResponseSchema,
  userListResponseSchema,
  userResponseSchema,
} from "../src/schemas/user.schema.js";
import {
  pokemonCardsSyncResponseSchema,
  pokemonCardPricesSyncResponseSchema,
  pokemonSetsSyncResponseSchema,
  syncPipelineResponseSchema,
} from "../src/schemas/sync.schema.js";

const tcg = {
  id: "ba080cea-f75e-4d41-b0f6-4a56328778f1",
  name: "Pokémon",
};

const counters = {
  received: 1,
  created: 1,
  updated: 0,
  unchanged: 0,
  skipped: 0,
  durationSeconds: 1,
};

describe("operational response schemas", () => {
  it("validates grading company list and mutation responses", () => {
    const company = {
      id: "8e72a594-fe11-46a9-9afa-14e92d0f40f0",
      name: "PSA",
      created_at: new Date(),
    };

    expect(
      gradingCompaniesListResponseSchema.parse({ data: [company] }).data,
    ).toHaveLength(1);
    expect(
      gradingCompanyMutationResponseSchema.parse({
        message: "ok",
        data: company,
      }).data.name,
    ).toBe("PSA");
  });

  it("validates individual sync summaries", () => {
    pokemonSetsSyncResponseSchema.parse({
      tcg,
      summary: {
        ...counters,
        pagesProcessed: 1,
        stoppedAtExisting: false,
      },
    });

    pokemonCardsSyncResponseSchema.parse({
      tcg,
      summary: {
        ...counters,
        setsProcessed: 1,
        setsSkipped: 0,
      },
    });

    pokemonCardPricesSyncResponseSchema.parse({
      tcg,
      summary: {
        setsProcessed: 1,
        skippedSets: 0,
        received: 1,
        pricesCreated: 1,
        pricesSkipped: 0,
        skippedCards: 0,
        durationSeconds: 1,
      },
    });
  });

  it("rejects an incomplete sync pipeline response", () => {
    expect(() => syncPipelineResponseSchema.parse({ status: "failed" })).toThrow();
  });

  it("validates auth and user responses without password fields", () => {
    const user = {
      id: "8e72a594-fe11-46a9-9afa-14e92d0f40f0",
      role: "user",
      email: "user@example.com",
      username: "collector",
      created_at: new Date(),
      updated_at: new Date(),
    };

    userResponseSchema.parse(user);
    userDataResponseSchema.parse({ data: user });
    userListResponseSchema.parse({
      data: [user],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
    userDeleteResponseSchema.parse({
      status: "success",
      message: "Usuario eliminado correctamente",
    });

    loginResponseSchema.parse({
      status: "success",
      data: {
        accessToken: "access-token",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      },
    });
    expect(() => refreshResponseSchema.parse({ status: "success" })).toThrow();
  });
});
