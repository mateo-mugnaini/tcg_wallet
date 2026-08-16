import { api } from "../../../../lib/http/api-client.js";
import { createApiAction } from "../../action-helpers.js";

export const updateTcg = createApiAction(
  "catalog/tcgs/update",
  ({ id, data }, { signal }) => api.patch(`/tcgs/${id}`, data, { signal }),
);
export const updateSet = createApiAction(
  "catalog/sets/update",
  ({ id, data }, { signal }) => api.patch(`/sets/${id}`, data, { signal }),
);
