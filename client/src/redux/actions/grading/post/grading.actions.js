import { api } from "../../../../lib/http/api-client.js";
import { createApiAction } from "../../action-helpers.js";

export const createGradingCompany = createApiAction("grading/create", (data, { signal }) =>
  api.post("/grading-companies", data, { signal }),
);
