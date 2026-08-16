import { api } from "../../../../lib/http/api-client.js";
import { createApiAction } from "../../action-helpers.js";

export const updateCard = createApiAction(
  "catalog/cards/update",
  ({ id, data }, { signal }) => api.put(`/cards/${id}`, data, { signal }),
);
