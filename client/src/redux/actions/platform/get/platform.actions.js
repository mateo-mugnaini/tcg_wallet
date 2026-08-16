import { api } from "../../../../lib/http/api-client.js";
import { createApiAction } from "../../action-helpers.js";

export const getOpenApiDocument = createApiAction("platform/getOpenApi", (_, { signal }) =>
  api.get("/docs/openapi.json", { signal }),
);
