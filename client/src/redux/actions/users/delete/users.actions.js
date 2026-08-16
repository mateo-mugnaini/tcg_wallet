import { api } from "../../../../lib/http/api-client.js";
import { createApiAction } from "../../action-helpers.js";

export const deleteUser = createApiAction("users/delete", (id, { signal }) =>
  api.delete(`/users/${id}`, { signal }),
);
