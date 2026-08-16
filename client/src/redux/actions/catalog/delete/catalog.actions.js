import { api } from "../../../../lib/http/api-client.js";
import { createApiAction } from "../../action-helpers.js";

export const deleteTcg = createApiAction("catalog/tcgs/delete", (id, { signal }) =>
  api.delete(`/tcgs/${id}`, { signal }),
);
export const deleteSet = createApiAction("catalog/sets/delete", (id, { signal }) =>
  api.delete(`/sets/${id}`, { signal }),
);
export const deleteCard = createApiAction("catalog/cards/delete", (id, { signal }) =>
  api.delete(`/cards/${id}`, { signal }),
);
