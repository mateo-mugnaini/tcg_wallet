import { api } from "../../../../lib/http/api-client.js";
import { createApiAction } from "../../action-helpers.js";

export const createCollectionItem = createApiAction(
  "collection/create",
  (data, { signal }) => api.post("/collection-items", data, { signal }),
);
