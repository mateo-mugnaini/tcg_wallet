import { api } from "../../../lib/http/api-client.js";
import { createApiAction } from "../action-helpers.js";

export const getOpeningStatus = createApiAction(
  "openings/getStatus",
  (_, { signal }) => api.get("/openings/status", { signal }),
);

export const getSetPokedex = createApiAction(
  "openings/getSetPokedex",
  ({ setId }, { signal }) => api.get(`/sets/${setId}/pokedex`, { signal }),
);

export const openPacks = createApiAction(
  "openings/openPacks",
  ({ setId, quantity }, { signal }) =>
    api.post(`/sets/${setId}/open`, { quantity }, { signal }),
);
