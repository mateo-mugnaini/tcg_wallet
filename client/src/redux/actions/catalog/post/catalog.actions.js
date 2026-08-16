import { api } from "../../../../lib/http/api-client.js";
import { createApiAction } from "../../action-helpers.js";

export const createTcg = createApiAction("catalog/tcgs/create", (data, { signal }) =>
  api.post("/tcgs", data, { signal }),
);
export const createSet = createApiAction("catalog/sets/create", (data, { signal }) =>
  api.post("/sets", data, { signal }),
);
export const createCard = createApiAction("catalog/cards/create", (data, { signal }) =>
  api.post("/cards", data, { signal }),
);
