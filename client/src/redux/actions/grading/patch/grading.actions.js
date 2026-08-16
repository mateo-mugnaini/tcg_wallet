import { api } from "../../../../lib/http/api-client.js";
import { createApiAction } from "../../action-helpers.js";

export const updateGradingCompany = createApiAction(
  "grading/update",
  ({ id, data }, { signal }) => api.patch(`/grading-companies/${id}`, data, { signal }),
);
