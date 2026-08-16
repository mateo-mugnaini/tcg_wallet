import { describe, expect, it } from "vitest";

import { openapiDocument, validateOpenApiDocument } from "../src/docs/openapi.js";

describe("OpenAPI contract", () => {
  it("exposes every documented operation with a valid OpenAPI document", () => {
    expect(validateOpenApiDocument(openapiDocument)).toBe(true);
    expect(openapiDocument.paths["/docs"]).toBeDefined();
    expect(openapiDocument.paths["/docs/openapi.json"]).toBeDefined();
  });

  it("distinguishes public operations from bearer-authenticated operations", () => {
    expect(openapiDocument.paths["/auth/login"].post.security).toEqual([]);
    expect(openapiDocument.paths["/users"].post.security).toEqual([]);
    expect(openapiDocument.paths["/cards"].get.security).toEqual([{ bearerAuth: [] }]);
    expect(openapiDocument.paths["/collection-items"].get.security).toEqual([{ bearerAuth: [] }]);
  });

  it("matches the executed auth, user and graded-price contracts", () => {
    const schemas = openapiDocument.components.schemas;

    expect(schemas.CreateUserRequest.required).toEqual(["username", "email", "password"]);
    expect(schemas.CreateUserRequest.properties.role).toBeUndefined();
    expect(schemas.UpdateUserRequest.properties.username).toBeDefined();
    expect(schemas.UpdateUserRequest.properties.role).toBeUndefined();
    expect(schemas.UserDeleteResponse.properties.data).toBeUndefined();
    expect(schemas.LoginResponse.properties.data.properties.user).toBeDefined();
    expect(schemas.CreateGradedCardPriceRequest.properties.condition).toBeUndefined();
    expect(schemas.ImportGradedPricesRequest.properties.prices.items).toEqual({
      $ref: "#/components/schemas/ImportGradedPriceItem",
    });
    expect(openapiDocument.paths["/users"].post.responses["201"].content["application/json"].schema).toEqual({
      $ref: "#/components/schemas/User",
    });
    expect(openapiDocument.paths["/users/{id}"].get.responses["200"].content["application/json"].schema).toEqual({
      $ref: "#/components/schemas/User",
    });
  });
});
