import { api } from "../../../../lib/http/api-client.js";
import { createApiAction } from "../../action-helpers.js";

export const getTcgs = createApiAction("catalog/tcgs/getList", (payload = {}, { signal }) =>
  api.get("/tcgs", { query: payload.query, signal }),
);
export const getTcgById = createApiAction("catalog/tcgs/getById", (id, { signal }) =>
  api.get(`/tcgs/${id}`, { signal }),
);
export const getSets = createApiAction("catalog/sets/getList", (payload = {}, { signal }) =>
  api.get("/sets", { query: payload.query, signal }),
);
export const getSetById = createApiAction("catalog/sets/getById", (id, { signal }) =>
  api.get(`/sets/${id}`, { signal }),
);
export const getCards = createApiAction("catalog/cards/getList", (payload = {}, { signal }) =>
  api.get("/cards", { query: payload.query, signal }),
);
export const getCardById = createApiAction("catalog/cards/getById", (id, { signal }) =>
  api.get(`/cards/${id}`, { signal }),
);
