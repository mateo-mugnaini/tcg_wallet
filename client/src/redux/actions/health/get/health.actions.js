import { api } from "../../../../lib/http/api-client.js";
import { createApiAction } from "../../action-helpers.js";

export const getHealth = createApiAction("health/get", (_, { signal }) =>
  api.get("/health", { signal }),
);
export const getReadiness = createApiAction("health/getReadiness", (_, { signal }) =>
  api.get("/health/ready", { signal }),
);
export const getMetrics = createApiAction("health/getMetrics", (_, { signal }) =>
  api.get("/metrics", { signal }),
);
