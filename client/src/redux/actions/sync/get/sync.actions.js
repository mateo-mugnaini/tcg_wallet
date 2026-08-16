import { api } from "../../../../lib/http/api-client.js";
import { createApiAction } from "../../action-helpers.js";

export const getSyncJobs = createApiAction("sync/getList", (_, { signal }) =>
  api.get("/sync/jobs", { signal }),
);
export const getSyncJobById = createApiAction("sync/getById", (id, { signal }) =>
  api.get(`/sync/jobs/${id}`, { signal }),
);
