import { api } from "../../../../lib/http/api-client.js";
import { createApiAction } from "../../action-helpers.js";

export const deleteCollectionItem = createApiAction(
  "collection/delete",
  (id, { signal }) => api.delete(`/collection-items/${id}`, { signal }),
);
