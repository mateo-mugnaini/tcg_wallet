import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";

import pool from "../src/config/database.js";
import {
  countCards,
  findCards,
} from "../src/repositories/cards.repository.js";
import {
  countCardPrices,
  findCardPrices,
} from "../src/repositories/cards-prices.repository.js";
import {
  countCollectionItems,
  findCollectionItems,
  getCollectionValue,
} from "../src/repositories/collection-items.repository.js";
import {
  countSets,
  findSets,
} from "../src/repositories/sets.repository.js";
import {
  countTcgs,
  findTcgs,
} from "../src/repositories/tcg.repository.js";
import {
  countGradedCardPrices,
  findGradedCardPrices,
} from "../src/repositories/graded-card-prices.repository.js";
import {
  claimNextSyncJob,
  completeSyncJob,
  createSyncJob,
  findSyncJobById,
} from "../src/repositories/sync-jobs.repository.js";

const databaseTests = process.env.RUN_DB_TESTS === "true" ? describe : describe.skip;
const EMPTY_USER_ID = "00000000-0000-4000-8000-000000000000";

databaseTests("repository integration against PostgreSQL", () => {
  let fixture;

  beforeAll(async () => {
    const result = await pool.query(`
      SELECT
        c.id AS card_id,
        c.set_id,
        s.tcg_id
      FROM cards c
      INNER JOIN sets s ON s.id = c.set_id
      ORDER BY c.created_at ASC
      LIMIT 1
    `);

    fixture = result.rows[0];
    expect(fixture).toBeDefined();
  });

  afterAll(async () => {
    await pool.end();
  });

  it("reads TCGs and sets with filters, sorting and counts", async () => {
    const tcgs = await findTcgs({
      limit: 5,
      offset: 0,
      sortBy: "name",
      sortOrder: "ASC",
    });
    const tcgTotal = await countTcgs({});
    const sets = await findSets({
      tcgId: fixture.tcg_id,
      limit: 5,
      offset: 0,
      sortBy: "name",
      sortOrder: "ASC",
    });
    const setTotal = await countSets({ tcgId: fixture.tcg_id });

    expect(tcgs.length).toBeGreaterThan(0);
    expect(tcgTotal).toBeGreaterThanOrEqual(tcgs.length);
    expect(sets.length).toBeGreaterThan(0);
    expect(setTotal).toBeGreaterThanOrEqual(sets.length);
  });

  it("reads cards and normal prices with parameterized filters", async () => {
    const cards = await findCards({
      setId: fixture.set_id,
      limit: 5,
      offset: 0,
      sortBy: "name",
      sortOrder: "ASC",
    });
    const cardTotal = await countCards({ setId: fixture.set_id });
    const prices = await findCardPrices({
      cardId: fixture.card_id,
      limit: 5,
      offset: 0,
      sortOrder: "DESC",
    });
    const priceTotal = await countCardPrices({ cardId: fixture.card_id });

    expect(cards.length).toBeGreaterThan(0);
    expect(cardTotal).toBeGreaterThanOrEqual(cards.length);
    expect(priceTotal).toBeGreaterThanOrEqual(prices.length);
  });

  it("keeps collection and graded-price reads isolated by ownership/filter", async () => {
    const collectionItems = await findCollectionItems({
      userId: EMPTY_USER_ID,
      limit: 5,
      offset: 0,
      sortBy: "created_at",
      sortOrder: "DESC",
    });
    const collectionTotal = await countCollectionItems({
      userId: EMPTY_USER_ID,
    });
    const gradedPrices = await findGradedCardPrices({
      cardId: fixture.card_id,
      limit: 5,
      offset: 0,
      sortOrder: "DESC",
    });
    const gradedTotal = await countGradedCardPrices({
      cardId: fixture.card_id,
    });

    expect(collectionItems).toEqual([]);
    expect(collectionTotal).toBe(0);
    expect(gradedTotal).toBeGreaterThanOrEqual(gradedPrices.length);
  });

  it("does not use a normal price when the exact graded price is missing", async () => {
    const userId = randomUUID();
    const cardId = randomUUID();
    const collectionItemId = randomUUID();
    const normalSource = `integration-normal-${userId}`;
    const gradedSource = `integration-graded-${userId}`;
    let psaCompanyId;

    try {
      const companyResult = await pool.query(
        "SELECT id FROM grading_companies WHERE name = $1",
        ["PSA"],
      );
      psaCompanyId = companyResult.rows[0]?.id;
      expect(psaCompanyId).toBeDefined();

      await pool.query(
        `
          INSERT INTO users (id, username, password, email, role)
          VALUES ($1, $2, $3, $4, $5)
        `,
        [userId, `integration-${userId}`, "not-a-real-password", `${userId}@example.test`, "user"],
      );
      await pool.query(
        `
          INSERT INTO cards (id, set_id, external_id, name, card_number)
          VALUES ($1, $2, $3, $4, $5)
        `,
        [cardId, fixture.set_id, `integration-${cardId}`, "Integration PSA card", "INT-1"],
      );
      await pool.query(
        `
          INSERT INTO collection_items (id, user_id, card_id, quantity, condition, is_graded, grading_company_id, grade)
          VALUES ($1, $2, $3, 2, $4, true, $5, 9.5)
        `,
        [collectionItemId, userId, cardId, "near_mint", psaCompanyId],
      );
      await pool.query(
        `
          INSERT INTO card_prices (card_id, condition, price, currency, source)
          VALUES ($1, $2, 999, $3, $4)
        `,
        [cardId, "near_mint", "USD", normalSource],
      );
      await pool.query(
        `
          INSERT INTO graded_card_prices (card_id, grading_company_id, grade, price, currency, source)
          VALUES ($1, $2, 9, 500, $3, $4)
        `,
        [cardId, psaCompanyId, "USD", gradedSource],
      );

      const value = await getCollectionValue(userId);

      expect(value.summary.totalEstimatedValue).toBe(0);
      expect(value.summary.itemsEvaluatedCount).toBe(0);
      expect(value.summary.itemsMissingPriceCount).toBe(1);
      expect(value.summary.gradedItemsMissingPriceCount).toBe(1);
      expect(value.summary.gradedItemsUsingFallbackPriceCount).toBe(0);
    } finally {
      await pool.query("DELETE FROM graded_card_prices WHERE card_id = $1", [cardId]);
      await pool.query("DELETE FROM card_prices WHERE card_id = $1", [cardId]);
      await pool.query("DELETE FROM collection_items WHERE id = $1", [collectionItemId]);
      await pool.query("DELETE FROM cards WHERE id = $1", [cardId]);
      await pool.query("DELETE FROM users WHERE id = $1", [userId]);
    }
  });

  it("exposes the persistent sync jobs table and concurrency index", async () => {
    const table = await pool.query(
      `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'sync_jobs'
      `,
    );
    const index = await pool.query(
      `
        SELECT indexname
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'sync_jobs'
          AND indexname = 'idx_sync_jobs_one_active'
      `,
    );

    expect(table.rows).toHaveLength(1);
    expect(index.rows).toHaveLength(1);
  });

  it("persists, claims and completes a sync job", async () => {
    const id = randomUUID();

    try {
      const created = await createSyncJob({ id, type: "sets" });
      const claimed = await claimNextSyncJob("integration-test-worker");
      const completed = await completeSyncJob(id, {
        status: "succeeded",
        durationMs: 12,
        result: { summary: { created: 0 } },
      });

      expect(created.status).toBe("queued");
      expect(claimed.id).toBe(id);
      expect(claimed.status).toBe("running");
      expect(completed.status).toBe("succeeded");
      expect((await findSyncJobById(id)).result).toEqual({
        summary: { created: 0 },
      });
    } finally {
      await pool.query("DELETE FROM sync_jobs WHERE id = $1", [id]);
    }
  });
});
