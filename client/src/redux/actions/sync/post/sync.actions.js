import { api } from "../../../../lib/http/api-client.js";
import { createApiAction } from "../../action-helpers.js";

export const createSyncJob = createApiAction("sync/createJob", (type, { signal }) =>
  api.post("/sync/jobs", { type }, { signal }),
);
export const runSyncPipeline = createApiAction("sync/runPipeline", () => api.post("/sync"));
export const importGradedPrices = createApiAction(
  "sync/importGradedPrices",
  (data, { signal }) => api.post("/sync/graded-prices", data, { signal }),
);
