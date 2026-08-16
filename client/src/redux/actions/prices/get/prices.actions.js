import { api } from "../../../../lib/http/api-client.js";
import { createApiAction } from "../../action-helpers.js";

const normalPath = (cardId) => `/cards/${cardId}/prices`;
const gradedPath = (cardId) => `/cards/${cardId}/graded-prices`;

export const getPrices = createApiAction("prices/normal/getList", ({ cardId, query }, { signal }) =>
  api.get(normalPath(cardId), { query, signal }),
);
export const getLatestPrice = createApiAction("prices/normal/getLatest", ({ cardId, query }, { signal }) =>
  api.get(`${normalPath(cardId)}/latest`, { query, signal }),
);
export const getPriceStats = createApiAction("prices/normal/getStats", ({ cardId, query }, { signal }) =>
  api.get(`${normalPath(cardId)}/stats`, { query, signal }),
);
export const getPriceVariation = createApiAction("prices/normal/getVariation", ({ cardId, query }, { signal }) =>
  api.get(`${normalPath(cardId)}/variation`, { query, signal }),
);
export const getPriceAggregations = createApiAction("prices/normal/getAggregations", ({ cardId, query }, { signal }) =>
  api.get(`${normalPath(cardId)}/aggregations`, { query, signal }),
);

export const getGradedPrices = createApiAction("prices/graded/getList", ({ cardId, query }, { signal }) =>
  api.get(gradedPath(cardId), { query, signal }),
);
export const getLatestGradedPrice = createApiAction("prices/graded/getLatest", ({ cardId, query }, { signal }) =>
  api.get(`${gradedPath(cardId)}/latest`, { query, signal }),
);
export const getGradedPriceStats = createApiAction("prices/graded/getStats", ({ cardId, query }, { signal }) =>
  api.get(`${gradedPath(cardId)}/stats`, { query, signal }),
);
export const getGradedPriceVariation = createApiAction("prices/graded/getVariation", ({ cardId, query }, { signal }) =>
  api.get(`${gradedPath(cardId)}/variation`, { query, signal }),
);
export const getGradedPriceAggregations = createApiAction("prices/graded/getAggregations", ({ cardId, query }, { signal }) =>
  api.get(`${gradedPath(cardId)}/aggregations`, { query, signal }),
);
