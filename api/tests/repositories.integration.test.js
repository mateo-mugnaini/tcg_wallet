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
