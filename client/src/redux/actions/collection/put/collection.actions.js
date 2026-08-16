import { api } from "../../../../lib/http/api-client.js";
import { createApiAction } from "../../action-helpers.js";

export const updateCollectionItem = createApiAction(
  "collection/update",
  ({ id, data }, { signal }) => api.put(`/collection-items/${id}`, data, { signal }),
);
