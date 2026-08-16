import { randomUUID } from "node:crypto";

import { createAppError } from "../errors/app.errors.js";
import {
  claimNextSyncJob,
  completeSyncJob,
  createSyncJob,
  findActiveSyncJob,
  findSyncJobById,
  listSyncJobs,
  requeueStaleSyncJobs,
} from "../repositories/sync-jobs.repository.js";
import { syncPokemonCardPrices } from "../syncs/cards-prices-sync.service.js";
import { syncPokemonCards } from "../syncs/cards.sync.service.js";
import { syncPokemonSets } from "../syncs/sets.sync.service.js";
import { syncPokemonPipeline } from "../syncs/sync.pipeline.service.js";
import { logger } from "../utils/logger.js";

export const SYNC_JOB_TYPES = ["sets", "cards", "prices", "pipeline"];

const defaultExecutors = {
  sets: syncPokemonSets,
  cards: syncPokemonCards,
  prices: syncPokemonCardPrices,
  pipeline: syncPokemonPipeline,
};

function summarizeResult(result) {
  if (!result || typeof result !== "object") {
    return result ?? null;
  }

  if (result.summary) {
    return { tcg: result.tcg, summary: result.summary };
  }

  return Object.fromEntries(
    Object.entries(result).map(([key, value]) => [
      key,
      value && typeof value === "object" && value.summary
        ? { tcg: value.tcg, summary: value.summary }
        : value,
    ]),
  );
}

function publicJob(job) {
  return {
    id: job.id,
    type: job.type,
    status: job.status,
    attempts: job.attempts ?? 0,
    queuedAt: job.queuedAt,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
    durationMs: job.durationMs,
    result: job.result,
    error: job.error,
  };
}

function publicJobOrNull(job) {
  return job ? publicJob(job) : null;
}

export class SyncJobQueue {
  constructor({
    executors = defaultExecutors,
    repository = null,
    workerId = randomUUID(),
    pollIntervalMs = 1000,
  } = {}) {
    this.executors = executors;
    this.repository = repository ?? {
      claimNextSyncJob,
      completeSyncJob,
      createSyncJob,
      findActiveSyncJob,
      findSyncJobById,
      listSyncJobs,
      requeueStaleSyncJobs,
    };
    this.workerId = workerId;
    this.pollIntervalMs = pollIntervalMs;
    this.pollTimer = null;
    this.workerRunning = false;
    this.activeJobId = null;
  }

  async enqueue(type) {
    if (!SYNC_JOB_TYPES.includes(type)) {
      throw createAppError("Tipo de sincronización no soportado", 400, "INVALID_JOB_TYPE");
    }

    const activeJob = await this.repository.findActiveSyncJob();

    if (activeJob) {
      throw createAppError(
        "Ya existe un job de sincronización en ejecución",
        409,
        "SYNC_JOB_IN_PROGRESS",
      );
    }

    const job = await this.repository.createSyncJob({ id: randomUUID(), type });
    void this.start();

    return publicJob(job);
  }

  async get(jobId) {
    return publicJobOrNull(await this.repository.findSyncJobById(jobId));
  }

  async list() {
    const [jobs, activeJob] = await Promise.all([
      this.repository.listSyncJobs(),
      this.repository.findActiveSyncJob(),
    ]);

    return {
      activeJobId: activeJob?.id ?? null,
      data: jobs.map(publicJob),
    };
  }

  async start() {
    if (this.workerRunning) {
      return;
    }

    this.workerRunning = true;

    try {
      await this.repository.requeueStaleSyncJobs();
      await this.processNext();
    } catch (error) {
      logger.error("sync_job_worker_start_failed", { message: error.message });
    }

    this.pollTimer = setInterval(() => {
      this.processNext().catch((error) => {
        logger.error("sync_job_worker_poll_failed", { message: error.message });
      });
    }, this.pollIntervalMs);
  }

  stop() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    this.workerRunning = false;
  }

  async processNext() {
    if (this.activeJobId) {
      return;
    }

    const job = await this.repository.claimNextSyncJob(this.workerId);

    if (!job) {
      return;
    }

    this.activeJobId = job.id;
    const startedAt = Date.now();

    logger.info("sync_job_started", {
      jobId: job.id,
      type: job.type,
      attempt: job.attempts,
    });

    try {
      const result = await this.executors[job.type]();

      await this.repository.completeSyncJob(job.id, {
        status: "succeeded",
        durationMs: Date.now() - startedAt,
        result: summarizeResult(result),
      });
    } catch (error) {
      const safeError = {
        code: error.code ?? "SYNC_JOB_FAILED",
        message: error.message ?? "Sync job failed",
      };

      await this.repository.completeSyncJob(job.id, {
        status: "failed",
        durationMs: Date.now() - startedAt,
        error: safeError,
      });

      logger.error("sync_job_failed", {
        jobId: job.id,
        type: job.type,
        code: safeError.code,
        message: safeError.message,
      });
    } finally {
      this.activeJobId = null;
      logger.info("sync_job_finished", { jobId: job.id, type: job.type });
    }
  }
}

export const syncJobQueue = new SyncJobQueue();
