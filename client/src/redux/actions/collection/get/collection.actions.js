import { api } from "../../../../lib/http/api-client.js";
import { createApiAction } from "../../action-helpers.js";

export const getCollectionItems = createApiAction("collection/getList", (payload = {}, { signal }) =>
  api.get("/collection-items", { query: payload.query, signal }),
);
export const getCollectionItemById = createApiAction("collection/getById", (id, { signal }) =>
  api.get(`/collection-items/${id}`, { signal }),
);
export const getCollectionStats = createApiAction("collection/getStats", (_, { signal }) =>
  api.get("/collection-items/stats", { signal }),
);
export const getCollectionValue = createApiAction("collection/getValue", (_, { signal }) =>
  api.get("/collection-items/value", { signal }),
);
