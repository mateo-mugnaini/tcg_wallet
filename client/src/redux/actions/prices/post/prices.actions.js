import { api } from "../../../../lib/http/api-client.js";
import { createApiAction } from "../../action-helpers.js";

export const createPrice = createApiAction(
  "prices/normal/create",
  ({ cardId, data }, { signal }) => api.post(`/cards/${cardId}/prices`, data, { signal }),
);
export const createGradedPrice = createApiAction(
  "prices/graded/create",
  ({ cardId, data }, { signal }) => api.post(`/cards/${cardId}/graded-prices`, data, { signal }),
);
export const syncPrices = createApiAction("prices/sync", () => api.post("/sync/cards/prices"));
