import { api } from "../../../../lib/http/api-client.js";
import { createApiAction } from "../../action-helpers.js";

export const createUser = createApiAction("users/create", (payload, { signal }) =>
  api.post("/users", payload, { signal, skipRefresh: true }),
);
