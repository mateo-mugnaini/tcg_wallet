import { api } from "../../../../lib/http/api-client.js";
import { createApiAction } from "../../action-helpers.js";

export const updateUser = createApiAction(
  "users/update",
  ({ id, data }, { signal }) => api.patch(`/users/${id}`, data, { signal }),
);
