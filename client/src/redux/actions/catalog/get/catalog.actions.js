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
export const getAllSets = createApiAction(
  "catalog/sets/getAll",
  async (payload = {}, { signal }) => {
    const firstQuery = { ...payload.query, page: 1, limit: 100 };
    const firstPage = await api.get("/sets", { query: firstQuery, signal });
    const totalPages = firstPage.pagination?.totalPages || 1;

    if (totalPages <= 1) return firstPage;

    const remainingPages = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) =>
        api.get("/sets", {
          query: { ...firstQuery, page: index + 2 },
          signal,
        }),
      ),
    );
    const data = [firstPage, ...remainingPages].flatMap((page) => page.data || []);

    return {
      data,
      pagination: {
        page: 1,
        limit: data.length || 1,
        total: firstPage.pagination?.total || data.length,
        totalPages: 1,
      },
    };
  },
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
