import { api } from "../../../../lib/http/api-client.js";
import { createApiAction } from "../../action-helpers.js";

export const login = createApiAction("auth/login", (credentials) =>
  api.post("/auth/login", credentials, { skipRefresh: true }),
);

export const refreshSession = createApiAction("auth/refresh", () =>
  api.post("/auth/refresh"),
);

export const logout = createApiAction("auth/logout", () =>
  api.post("/auth/logout"),
);
