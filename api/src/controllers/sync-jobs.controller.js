import { createAppError } from "../errors/app.errors.js";
import { syncJobQueue } from "../jobs/sync-job.queue.js";

async function enqueue(type, res) {
  const job = await syncJobQueue.enqueue(type);
  return res.status(202).json({ data: job });
}

export async function createSyncJobController(req, res, next) {
  try {
    return await enqueue(req.validated.body.type, res);
  } catch (error) {
    next(error);
  }
}

export function createSyncJobTypeController(type) {
  return async (_req, res, next) => {
    try {
      return await enqueue(type, res);
    } catch (error) {
      next(error);
    }
  };
}

export async function getSyncJobController(req, res, next) {
  try {
    const job = await syncJobQueue.get(req.validated.params.id);

    if (!job) {
      throw createAppError("Job de sincronización no encontrado", 404, "JOB_NOT_FOUND");
    }

    return res.status(200).json({ data: job });
  } catch (error) {
    next(error);
  }
}

export async function listSyncJobsController(_req, res, next) {
  try {
    return res.status(200).json(await syncJobQueue.list());
  } catch (error) {
    next(error);
  }
}
