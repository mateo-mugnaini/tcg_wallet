import { afterEach, describe, expect, it, vi } from "vitest";

import { SyncJobQueue } from "../src/jobs/sync-job.queue.js";

function createFakeRepository() {
  const jobs = new Map();

  return {
    jobs,
    async createSyncJob({ id, type }) {
      const job = {
        id,
        type,
        status: "queued",
        attempts: 0,
        queuedAt: new Date().toISOString(),
        startedAt: null,
        finishedAt: null,
        durationMs: null,
        result: null,
        error: null,
      };
      jobs.set(id, job);
      return { ...job };
    },
    async findActiveSyncJob() {
      return [...jobs.values()].find((job) =>
        ["queued", "running"].includes(job.status),
      ) ?? null;
    },
    async findSyncJobById(id) {
      const job = jobs.get(id);
      return job ? { ...job } : null;
    },
    async listSyncJobs() {
      return [...jobs.values()].map((job) => ({ ...job }));
    },
    async claimNextSyncJob() {
      const job = [...jobs.values()].find((item) => item.status === "queued");
      if (!job) return null;
      job.status = "running";
      job.attempts += 1;
      job.startedAt = new Date().toISOString();
      return { ...job };
    },
    async completeSyncJob(id, update) {
      const job = jobs.get(id);
      Object.assign(job, update, {
        finishedAt: new Date().toISOString(),
      });
      return { ...job };
    },
    async requeueStaleSyncJobs() {},
  };
}

const waitForTerminalStatus = async (queue, jobId) => {
  for (let attempt = 0; attempt < 20; attempt++) {
    const job = await queue.get(jobId);

    if (["succeeded", "failed"].includes(job.status)) {
      return job;
    }

    await new Promise((resolve) => setTimeout(resolve, 5));
  }

  throw new Error("Job did not finish in time");
};

describe("SyncJobQueue", () => {
  let queue;

  afterEach(() => {
    queue?.stop();
  });

  it("runs a persistent job asynchronously and stores its summary", async () => {
    const repository = createFakeRepository();
    queue = new SyncJobQueue({
      repository,
      executors: {
        sets: vi.fn(async () => ({ tcg: { id: "tcg-1" }, summary: { created: 2 } })),
        cards: vi.fn(),
        prices: vi.fn(),
        pipeline: vi.fn(),
      },
      pollIntervalMs: 100,
    });

    const queued = await queue.enqueue("sets");

    expect(queued.status).toBe("queued");
    const completed = await waitForTerminalStatus(queue, queued.id);

    expect(completed.status).toBe("succeeded");
    expect(completed.attempts).toBe(1);
    expect(completed.result).toEqual({
      tcg: { id: "tcg-1" },
      summary: { created: 2 },
    });
  });

  it("prevents concurrent jobs", async () => {
    const repository = createFakeRepository();
    queue = new SyncJobQueue({
      repository,
      executors: {
        sets: () => new Promise(() => {}),
        cards: vi.fn(),
        prices: vi.fn(),
        pipeline: vi.fn(),
      },
    });

    await queue.enqueue("sets");

    await expect(queue.enqueue("pipeline")).rejects.toThrow(
      "Ya existe un job de sincronización en ejecución",
    );
  });

  it("stores a safe summarized error when execution fails", async () => {
    const repository = createFakeRepository();
    queue = new SyncJobQueue({
      repository,
      executors: {
        sets: vi.fn(async () => {
          const error = new Error("provider unavailable");
          error.code = "PROVIDER_DOWN";
          error.stack = "sensitive stack";
          throw error;
        }),
        cards: vi.fn(),
        prices: vi.fn(),
        pipeline: vi.fn(),
      },
    });

    const queued = await queue.enqueue("sets");
    const failed = await waitForTerminalStatus(queue, queued.id);

    expect(failed.status).toBe("failed");
    expect(failed.error).toEqual({
      code: "PROVIDER_DOWN",
      message: "provider unavailable",
    });
    expect(failed.error.stack).toBeUndefined();
  });
});
