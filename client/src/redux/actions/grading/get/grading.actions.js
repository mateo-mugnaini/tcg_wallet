import { api } from "../../../../lib/http/api-client.js";
import { createApiAction } from "../../action-helpers.js";

export const getGradingCompanies = createApiAction("grading/getList", (_, { signal }) =>
  api.get("/grading-companies", { signal }),
);
export const getGradingCompanyById = createApiAction("grading/getById", (id, { signal }) =>
  api.get(`/grading-companies/${id}`, { signal }),
);
