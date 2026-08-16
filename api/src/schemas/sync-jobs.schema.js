import { z } from "zod";

export const syncJobTypeSchema = z.enum(["sets", "cards", "prices", "pipeline"]);

export const createSyncJobSchema = z.object({
  type: syncJobTypeSchema,
});

export const syncJobIdParamsSchema = z.object({
  id: z.string().uuid(),
});

const syncJobSchema = z.object({
  id: z.string().uuid(),
  type: syncJobTypeSchema,
  status: z.enum(["queued", "running", "succeeded", "failed"]),
  attempts: z.number().int().nonnegative(),
  queuedAt: z.string(),
  startedAt: z.string().nullable(),
  finishedAt: z.string().nullable(),
  durationMs: z.number().int().nonnegative().nullable(),
  result: z.unknown().nullable(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
    })
    .nullable(),
});

export const syncJobResponseSchema = z.object({
  data: syncJobSchema,
});

export const syncJobsListResponseSchema = z.object({
  activeJobId: z.string().uuid().nullable(),
  data: z.array(syncJobSchema),
});
