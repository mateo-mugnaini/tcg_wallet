import { api } from "../../../../lib/http/api-client.js";
import { createApiAction } from "../../action-helpers.js";

export const getUsers = createApiAction("users/getList", (payload = {}, { signal }) =>
  api.get("/users", { query: payload.query, signal }),
);

export const getUserById = createApiAction("users/getById", (id, { signal }) =>
  api.get(`/users/${id}`, { signal }),
);

export const getUserByEmail = createApiAction(
  "users/getByEmail",
  (email, { signal }) => api.get(`/users/email/${encodeURIComponent(email)}`, { signal }),
);
