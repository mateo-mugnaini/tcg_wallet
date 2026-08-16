import { openapiDocument, validateOpenApiDocument } from "../src/docs/openapi.js";

validateOpenApiDocument(openapiDocument);

const operationCount = Object.values(openapiDocument.paths).reduce(
  (count, pathItem) =>
    count + Object.keys(pathItem).filter((method) =>
      ["get", "post", "put", "patch", "delete"].includes(method),
    ).length,
  0,
);

console.log(
  `OpenAPI valid: ${Object.keys(openapiDocument.paths).length} paths, ${operationCount} operations.`,
);
