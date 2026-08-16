import { api } from "../../../../lib/http/api-client.js";
import { createApiAction } from "../../action-helpers.js";

export const deleteGradingCompany = createApiAction("grading/delete", (id, { signal }) =>
  api.delete(`/grading-companies/${id}`, { signal }),
);
