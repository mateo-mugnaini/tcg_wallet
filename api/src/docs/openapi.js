const ref = (name) => ({ $ref: `#/components/schemas/${name}` });

const uuid = {
  type: "string",
  format: "uuid",
};

const jsonResponse = (description, schema) => ({
  description,
  content: {
    "application/json": {
      schema,
    },
  },
});

const errorResponses = {
  "400": jsonResponse("Invalid request", ref("ErrorResponse")),
  "401": jsonResponse("Authentication required or invalid", ref("ErrorResponse")),
  "403": jsonResponse("Insufficient permissions", ref("ErrorResponse")),
  "404": jsonResponse("Resource not found", ref("ErrorResponse")),
  "409": jsonResponse("Resource conflict", ref("ErrorResponse")),
  "429": jsonResponse("Rate limit exceeded", ref("ErrorResponse")),
  "500": jsonResponse("Unexpected server error", ref("ErrorResponse")),
};

const parameter = (name, inValue, schema, required = false, description) => ({
  name,
  in: inValue,
  required,
  ...(description ? { description } : {}),
  schema,
});

const queryString = (name, description) =>
  parameter(name, "query", { type: "string" }, false, description);

const operation = ({
  operationId,
  summary,
  tag,
  successSchema,
  successStatus = "200",
  auth = true,
  admin = false,
  params = [],
  query = [],
  body,
  extraResponses = {},
}) => ({
  operationId,
  summary,
  tags: [tag],
  ...(auth ? { security: [{ bearerAuth: [] }] } : { security: [] }),
  ...(params.length || query.length
    ? { parameters: [...params, ...query] }
    : {}),
  ...(body
    ? {
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: ref(body),
            },
          },
        },
      }
    : {}),
  responses: {
    [successStatus]: successStatus === "204"
      ? { description: "Successful response" }
      : jsonResponse("Successful response", ref(successSchema)),
    ...(auth ? errorResponses : { "400": errorResponses["400"], "429": errorResponses["429"], "500": errorResponses["500"] }),
    ...(admin ? { "403": errorResponses["403"] } : {}),
    ...extraResponses,
  },
});

const resourceSchemas = {
  Tcg: {
    type: "object",
    required: ["id", "name", "created_at"],
    properties: { id: uuid, name: { type: "string" }, created_at: { type: "string", format: "date-time" } },
  },
  Set: {
    type: "object",
    required: ["id", "tcg_id", "name"],
    properties: {
      id: uuid,
      tcg_id: uuid,
      external_id: { type: "string", nullable: true },
      name: { type: "string" },
      code: { type: "string", nullable: true },
      release_date: { type: "string", format: "date", nullable: true },
      created_at: { type: "string", format: "date-time" },
    },
  },
  Card: {
    type: "object",
    required: ["id", "set_id", "name"],
    properties: {
      id: uuid,
      set_id: uuid,
      external_id: { type: "string", nullable: true },
      name: { type: "string" },
      card_number: { type: "string", nullable: true },
      rarity: { type: "string", nullable: true },
      image_url: { type: "string", format: "uri", nullable: true },
      created_at: { type: "string", format: "date-time" },
      updated_at: { type: "string", format: "date-time" },
    },
  },
  User: {
    type: "object",
    required: ["id", "role", "email", "username", "created_at", "updated_at"],
    properties: {
      id: uuid,
      username: { type: "string", minLength: 3, maxLength: 50 },
      email: { type: "string", format: "email" },
      role: { type: "string", enum: ["user", "admin"] },
      created_at: { type: "string", format: "date-time" },
      updated_at: { type: "string", format: "date-time" },
    },
  },
  GradingCompany: {
    type: "object",
    required: ["id", "name"],
    properties: {
      id: uuid,
      name: { type: "string" },
      created_at: { type: "string", format: "date-time" },
    },
  },
  CardPrice: {
    type: "object",
    required: ["id", "card_id", "condition", "price", "currency", "source", "recorded_at"],
    properties: {
      id: uuid,
      card_id: uuid,
      condition: { type: "string" },
      price: { type: "number", format: "double", minimum: 0 },
      currency: { type: "string" },
      source: { type: "string" },
      recorded_at: { type: "string", format: "date-time" },
    },
  },
  GradedCardPrice: {
    type: "object",
    required: ["id", "card_id", "grading_company_id", "grade", "price", "currency", "source", "recorded_at"],
    properties: {
      id: uuid,
      card_id: uuid,
      grading_company_id: uuid,
      grade: { type: "number", minimum: 0, maximum: 10 },
      price: { type: "number", format: "double", minimum: 0 },
      currency: { type: "string" },
      source: { type: "string" },
      recorded_at: { type: "string", format: "date-time" },
    },
  },
  CollectionItem: {
    type: "object",
    required: ["id", "user_id", "card_id", "quantity", "condition", "is_graded", "grading_company_id", "grade", "created_at", "updated_at", "card", "set", "tcg", "grading_company"],
    properties: {
      id: uuid,
      user_id: uuid,
      card_id: uuid,
      quantity: { type: "integer", minimum: 1 },
      condition: { type: "string" },
      is_graded: { type: "boolean" },
      grading_company_id: { ...uuid, nullable: true },
      grade: { type: "number", minimum: 0, maximum: 10, nullable: true },
      created_at: { type: "string", format: "date-time" },
      updated_at: { type: "string", format: "date-time" },
      card: {
        type: "object",
        required: ["id", "set_id", "external_id", "name", "card_number", "rarity", "image_url"],
        properties: {
          id: uuid,
          set_id: uuid,
          external_id: { type: "string", nullable: true },
          name: { type: "string" },
          card_number: { type: "string", nullable: true },
          rarity: { type: "string", nullable: true },
          image_url: { type: "string", nullable: true },
        },
      },
      set: {
        type: "object",
        required: ["id", "tcg_id", "name", "code", "release_date"],
        properties: {
          id: uuid,
          tcg_id: uuid,
          name: { type: "string" },
          code: { type: "string", nullable: true },
          release_date: { type: "string", format: "date", nullable: true },
        },
      },
      tcg: {
        type: "object",
        required: ["id", "name"],
        properties: { id: uuid, name: { type: "string" } },
      },
      grading_company: {
        type: "object",
        nullable: true,
        required: ["id", "name"],
        properties: { id: uuid, name: { type: "string" } },
      },
    },
  },
};

const paginated = (item) => ({
  type: "object",
  required: ["data", "pagination"],
  properties: {
    data: { type: "array", items: ref(item) },
    pagination: ref("Pagination"),
  },
});

const dataResponse = (item) => ({
  type: "object",
  required: ["data"],
  properties: { data: ref(item) },
});

const mutationResponse = (item) => ({
  type: "object",
  required: ["message", "data"],
  properties: {
    message: { type: "string" },
    data: ref(item),
  },
});

export const openapiDocument = {
  openapi: "3.0.3",
  info: {
    title: "TCG Wallet API",
    version: "1.0.0",
    description:
      "API REST para autenticación, catálogo TCG, precios históricos, colección, grading y sincronización Pokémon.",
  },
  servers: [{ url: "/api", description: "Current API server" }],
  tags: [
    { name: "Health", description: "Liveness, readiness and metrics" },
    { name: "Auth", description: "Login and refresh-token sessions" },
    { name: "Users", description: "User accounts and administration" },
    { name: "TCGs", description: "Trading card game catalog" },
    { name: "Sets", description: "Set catalog and synchronization" },
    { name: "Cards", description: "Card catalog and synchronization" },
    { name: "Prices", description: "Normal and graded price history" },
    { name: "Collection", description: "Authenticated user collection" },
    { name: "Grading", description: "Grading companies" },
    { name: "Sync", description: "Administrative synchronization jobs" },
    { name: "Documentation", description: "OpenAPI contract" },
  ],
  paths: {
    "/health": {
      get: operation({ operationId: "health", summary: "Application liveness", tag: "Health", successSchema: "HealthResponse", auth: false }),
    },
    "/health/live": {
      get: operation({ operationId: "healthLive", summary: "Container liveness", tag: "Health", successSchema: "HealthResponse", auth: false }),
    },
    "/health/ready": {
      get: operation({ operationId: "healthReady", summary: "Database readiness", tag: "Health", successSchema: "ReadinessResponse", auth: false, extraResponses: { "503": jsonResponse("Database unavailable", ref("ReadinessFailureResponse")) } }),
    },
    "/metrics": {
      get: operation({ operationId: "metrics", summary: "Aggregated HTTP metrics", tag: "Health", successSchema: "MetricsResponse", auth: false }),
    },
    "/docs": {
      get: operation({ operationId: "docsIndex", summary: "Documentation entry point", tag: "Documentation", successSchema: "DocsIndexResponse", auth: false }),
    },
    "/docs/openapi.json": {
      get: operation({ operationId: "openapiDocument", summary: "OpenAPI contract", tag: "Documentation", successSchema: "OpenApiDocument", auth: false }),
    },
    "/auth/login": {
      post: operation({ operationId: "login", summary: "Authenticate a user", tag: "Auth", successSchema: "LoginResponse", auth: false, body: "LoginRequest" }),
    },
    "/auth/refresh": {
      post: operation({ operationId: "refresh", summary: "Refresh the access token", tag: "Auth", successSchema: "RefreshResponse", auth: false, extraResponses: { "401": errorResponses["401"] } }),
    },
    "/auth/logout": {
      post: operation({ operationId: "logout", summary: "Clear the refresh session cookie", tag: "Auth", successSchema: "EmptyResponse", successStatus: "204", auth: false }),
    },
    "/users": {
      post: operation({ operationId: "createUser", summary: "Register a user", tag: "Users", successSchema: "User", successStatus: "201", auth: false, body: "CreateUserRequest", extraResponses: { "409": errorResponses["409"] } }),
      get: operation({ operationId: "listUsers", summary: "List users (admin)", tag: "Users", successSchema: "UserListResponse", admin: true, query: [queryString("search"), queryString("page"), queryString("limit"), queryString("sortBy"), queryString("sortOrder")] }),
    },
    "/users/email/{email}": {
      get: operation({ operationId: "getUserByEmail", summary: "Get a user by email (admin)", tag: "Users", successSchema: "User", admin: true, params: [parameter("email", "path", { type: "string", format: "email" }, true)] }),
    },
    "/users/{id}": {
      get: operation({ operationId: "getUser", summary: "Get own user or any user (admin)", tag: "Users", successSchema: "User", params: [parameter("id", "path", uuid, true)] }),
      patch: operation({ operationId: "updateUser", summary: "Update own user or any user (admin)", tag: "Users", successSchema: "User", body: "UpdateUserRequest", params: [parameter("id", "path", uuid, true)] }),
      delete: operation({ operationId: "deleteUser", summary: "Delete own user or any user (admin)", tag: "Users", successSchema: "UserDeleteResponse", params: [parameter("id", "path", uuid, true)] }),
    },
    "/tcgs": {
      post: operation({ operationId: "createTcg", summary: "Create a TCG (admin)", tag: "TCGs", successSchema: "TcgResponse", successStatus: "201", admin: true, body: "CreateTcgRequest" }),
      get: operation({ operationId: "listTcgs", summary: "List TCGs", tag: "TCGs", successSchema: "TcgListResponse", query: [queryString("search"), queryString("page"), queryString("limit"), queryString("sortBy"), queryString("sortOrder")] }),
    },
    "/tcgs/{id}": {
      get: operation({ operationId: "getTcg", summary: "Get a TCG", tag: "TCGs", successSchema: "TcgResponse", params: [parameter("id", "path", uuid, true)] }),
      patch: operation({ operationId: "updateTcg", summary: "Update a TCG (admin)", tag: "TCGs", successSchema: "TcgResponse", admin: true, params: [parameter("id", "path", uuid, true)], body: "UpdateTcgRequest" }),
      delete: operation({ operationId: "deleteTcg", summary: "Delete a TCG (admin)", tag: "TCGs", successSchema: "TcgResponse", admin: true, params: [parameter("id", "path", uuid, true)] }),
    },
    "/sets": {
      post: operation({ operationId: "createSet", summary: "Create a set (admin)", tag: "Sets", successSchema: "SetResponse", successStatus: "201", admin: true, body: "CreateSetRequest" }),
      get: operation({ operationId: "listSets", summary: "List sets", tag: "Sets", successSchema: "SetListResponse", query: [queryString("tcgId"), queryString("search"), queryString("page"), queryString("limit"), queryString("sortBy"), queryString("sortOrder")] }),
    },
    "/sets/sync/pokemon": {
      post: operation({ operationId: "syncPokemonSets", summary: "Start asynchronous Pokémon sets sync (admin)", tag: "Sets", successSchema: "SyncJobResponse", successStatus: "202", admin: true }),
    },
    "/sets/{id}": {
      get: operation({ operationId: "getSet", summary: "Get a set", tag: "Sets", successSchema: "SetResponse", params: [parameter("id", "path", uuid, true)] }),
      patch: operation({ operationId: "updateSet", summary: "Update a set (admin)", tag: "Sets", successSchema: "SetResponse", admin: true, params: [parameter("id", "path", uuid, true)], body: "UpdateSetRequest" }),
      delete: operation({ operationId: "deleteSet", summary: "Delete a set (admin)", tag: "Sets", successSchema: "SetResponse", admin: true, params: [parameter("id", "path", uuid, true)] }),
    },
    "/cards": {
      get: operation({ operationId: "listCards", summary: "List cards", tag: "Cards", successSchema: "CardListResponse", query: [queryString("setId"), queryString("tcgId"), queryString("search"), queryString("rarity"), queryString("cardNumber"), queryString("externalId"), queryString("page"), queryString("limit"), queryString("sortBy"), queryString("sortOrder")] }),
      post: operation({ operationId: "createCard", summary: "Create a card (admin)", tag: "Cards", successSchema: "CardResponse", successStatus: "201", admin: true, body: "CreateCardRequest" }),
    },
    "/cards/{id}": {
      get: operation({ operationId: "getCard", summary: "Get a card with catalog context", tag: "Cards", successSchema: "CardDetailResponse", params: [parameter("id", "path", uuid, true)] }),
      put: operation({ operationId: "updateCard", summary: "Update a card (admin)", tag: "Cards", successSchema: "CardResponse", admin: true, params: [parameter("id", "path", uuid, true)], body: "UpdateCardRequest" }),
      delete: operation({ operationId: "deleteCard", summary: "Delete a card (admin)", tag: "Cards", successSchema: "CardResponse", admin: true, params: [parameter("id", "path", uuid, true)] }),
    },
    "/cards/sync/pokemon": {
      post: operation({ operationId: "syncPokemonCards", summary: "Start asynchronous Pokémon cards sync (admin)", tag: "Cards", successSchema: "SyncJobResponse", successStatus: "202", admin: true }),
    },
    "/cards/{cardId}/prices": {
      get: operation({ operationId: "listCardPrices", summary: "List normal price history", tag: "Prices", successSchema: "CardPriceListResponse", params: [parameter("cardId", "path", uuid, true)], query: [queryString("source"), queryString("condition"), queryString("page"), queryString("limit"), queryString("sortOrder")] }),
      post: operation({ operationId: "createCardPrice", summary: "Register a normal price (admin)", tag: "Prices", successSchema: "CardPriceResponse", successStatus: "201", admin: true, params: [parameter("cardId", "path", uuid, true)], body: "CreateCardPriceRequest" }),
    },
    "/cards/{cardId}/prices/latest": {
      get: operation({ operationId: "latestCardPrice", summary: "Get latest normal price", tag: "Prices", successSchema: "CardPriceResponse", params: [parameter("cardId", "path", uuid, true)], query: [queryString("source"), queryString("condition")] }),
    },
    "/cards/{cardId}/prices/stats": {
      get: operation({ operationId: "cardPriceStats", summary: "Get normal price statistics", tag: "Prices", successSchema: "CardPriceStatisticsResponse", params: [parameter("cardId", "path", uuid, true)], query: [queryString("source"), queryString("condition")] }),
    },
    "/cards/{cardId}/prices/variation": {
      get: operation({ operationId: "cardPriceVariation", summary: "Get normal price variation", tag: "Prices", successSchema: "CardPriceVariationResponse", params: [parameter("cardId", "path", uuid, true)], query: [queryString("source"), queryString("condition")] }),
    },
    "/cards/{cardId}/prices/aggregations": {
      get: operation({ operationId: "cardPriceAggregations", summary: "Get normal price aggregations", tag: "Prices", successSchema: "CardPriceAggregationsResponse", params: [parameter("cardId", "path", uuid, true)], query: [queryString("source"), queryString("condition"), queryString("period")] }),
    },
    "/sync/cards/prices": {
      post: operation({ operationId: "syncPokemonPrices", summary: "Start asynchronous Pokémon prices sync (admin)", tag: "Prices", successSchema: "SyncJobResponse", successStatus: "202", admin: true }),
    },
    "/cards/{cardId}/graded-prices": {
      get: operation({ operationId: "listGradedPrices", summary: "List graded price history", tag: "Prices", successSchema: "GradedCardPriceListResponse", params: [parameter("cardId", "path", uuid, true)], query: [queryString("gradingCompanyId"), queryString("grade"), queryString("page"), queryString("limit"), queryString("sortOrder")] }),
      post: operation({ operationId: "createGradedPrice", summary: "Register a graded price (admin)", tag: "Prices", successSchema: "GradedCardPriceResponse", successStatus: "201", admin: true, params: [parameter("cardId", "path", uuid, true)], body: "CreateGradedCardPriceRequest" }),
    },
    "/cards/{cardId}/graded-prices/latest": {
      get: operation({ operationId: "latestGradedPrice", summary: "Get latest graded price", tag: "Prices", successSchema: "GradedCardPriceResponse", params: [parameter("cardId", "path", uuid, true)], query: [queryString("gradingCompanyId"), queryString("grade")] }),
    },
    "/cards/{cardId}/graded-prices/stats": {
      get: operation({ operationId: "gradedPriceStats", summary: "Get graded price statistics", tag: "Prices", successSchema: "GradedPriceStatisticsResponse", params: [parameter("cardId", "path", uuid, true)], query: [queryString("gradingCompanyId"), queryString("grade")] }),
    },
    "/cards/{cardId}/graded-prices/variation": {
      get: operation({ operationId: "gradedPriceVariation", summary: "Get graded price variation", tag: "Prices", successSchema: "GradedPriceVariationResponse", params: [parameter("cardId", "path", uuid, true)], query: [queryString("gradingCompanyId"), queryString("grade")] }),
    },
    "/cards/{cardId}/graded-prices/aggregations": {
      get: operation({ operationId: "gradedPriceAggregations", summary: "Get graded price aggregations", tag: "Prices", successSchema: "GradedPriceAggregationsResponse", params: [parameter("cardId", "path", uuid, true)], query: [queryString("gradingCompanyId"), queryString("grade"), queryString("period")] }),
    },
    "/collection-items": {
      get: operation({ operationId: "listCollectionItems", summary: "List the authenticated collection", tag: "Collection", successSchema: "CollectionListResponse", query: [queryString("cardId"), queryString("condition"), queryString("isGraded"), queryString("setId"), queryString("tcgId"), queryString("rarity"), queryString("gradingCompanyId"), queryString("minGrade"), queryString("maxGrade"), queryString("limit"), queryString("offset"), queryString("sortBy"), queryString("sortOrder")] }),
      post: operation({ operationId: "createCollectionItem", summary: "Add a card to the collection", tag: "Collection", successSchema: "CollectionMutationResponse", successStatus: "201", body: "CreateCollectionItemRequest" }),
    },
    "/collection-items/stats": {
      get: operation({ operationId: "collectionStats", summary: "Get collection statistics", tag: "Collection", successSchema: "CollectionStatsResponse" }),
    },
    "/collection-items/value": {
      get: operation({ operationId: "collectionValue", summary: "Estimate collection value", tag: "Collection", successSchema: "CollectionValueResponse" }),
    },
    "/collection-items/{id}": {
      get: operation({ operationId: "getCollectionItem", summary: "Get a collection item", tag: "Collection", successSchema: "CollectionItemResponse", params: [parameter("id", "path", uuid, true)] }),
      put: operation({ operationId: "updateCollectionItem", summary: "Update a collection item", tag: "Collection", successSchema: "CollectionMutationResponse", params: [parameter("id", "path", uuid, true)], body: "UpdateCollectionItemRequest" }),
      delete: operation({ operationId: "deleteCollectionItem", summary: "Delete a collection item", tag: "Collection", successSchema: "CollectionMutationResponse", params: [parameter("id", "path", uuid, true)] }),
    },
    "/grading-companies": {
      get: operation({ operationId: "listGradingCompanies", summary: "List grading companies", tag: "Grading", successSchema: "GradingCompanyListResponse" }),
      post: operation({ operationId: "createGradingCompany", summary: "Create a grading company (admin)", tag: "Grading", successSchema: "GradingCompanyMutationResponse", successStatus: "201", admin: true, body: "CreateGradingCompanyRequest" }),
    },
    "/grading-companies/{id}": {
      get: operation({ operationId: "getGradingCompany", summary: "Get a grading company", tag: "Grading", successSchema: "GradingCompanyResponse", params: [parameter("id", "path", uuid, true)] }),
      patch: operation({ operationId: "updateGradingCompany", summary: "Update a grading company (admin)", tag: "Grading", successSchema: "GradingCompanyMutationResponse", admin: true, params: [parameter("id", "path", uuid, true)], body: "UpdateGradingCompanyRequest" }),
      delete: operation({ operationId: "deleteGradingCompany", summary: "Delete a grading company (admin)", tag: "Grading", successSchema: "GradingCompanyMutationResponse", admin: true, params: [parameter("id", "path", uuid, true)] }),
    },
    "/sync": {
      post: operation({ operationId: "syncPipeline", summary: "Start asynchronous complete Pokémon sync pipeline (admin)", tag: "Sync", successSchema: "SyncJobResponse", successStatus: "202", admin: true }),
    },
    "/sync/jobs": {
      post: operation({ operationId: "createSyncJob", summary: "Start an asynchronous sync job (admin)", tag: "Sync", successSchema: "SyncJobResponse", successStatus: "202", admin: true, body: "CreateSyncJobRequest" }),
      get: operation({ operationId: "listSyncJobs", summary: "List sync jobs (admin)", tag: "Sync", successSchema: "SyncJobsListResponse", admin: true }),
    },
    "/sync/jobs/{id}": {
      get: operation({ operationId: "getSyncJob", summary: "Get an asynchronous sync job (admin)", tag: "Sync", successSchema: "SyncJobResponse", admin: true, params: [parameter("id", "path", uuid, true)] }),
    },
    "/sync/graded-prices": {
      post: operation({ operationId: "importGradedPrices", summary: "Import graded price snapshots (admin)", tag: "Sync", successSchema: "GradedPricesImportResponse", admin: true, body: "ImportGradedPricesRequest" }),
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Access JWT. Refresh tokens are managed through an httpOnly cookie.",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        required: ["status", "message"],
        properties: { status: { type: "string", example: "error" }, message: { type: "string" }, code: { type: "string" } },
      },
      EmptyResponse: { type: "object", nullable: true },
      HealthResponse: { type: "object", properties: { status: { type: "string", example: "ok" } } },
      DocsIndexResponse: { type: "object", required: ["status", "openapi"], properties: { status: { type: "string", enum: ["ok"] }, openapi: { type: "string", example: "/api/docs/openapi.json" } } },
      ReadinessResponse: { type: "object", properties: { status: { type: "string", example: "ready" }, checks: { type: "object", properties: { database: { type: "string", example: "ok" } } }, durationMs: { type: "number" } } },
      ReadinessFailureResponse: { type: "object", properties: { status: { type: "string", example: "not_ready" }, checks: { type: "object", properties: { database: { type: "string", example: "unavailable" } } } } },
      Pagination: { type: "object", properties: { page: { type: "integer" }, limit: { type: "integer" }, offset: { type: "integer" }, total: { type: "integer" }, totalPages: { type: "integer" } } },
      MetricsResponse: { type: "object", properties: { status: { type: "string" }, metrics: { type: "object", additionalProperties: true } } },
      OpenApiDocument: { type: "object", description: "This OpenAPI document" },
      Tcg: resourceSchemas.Tcg,
      Set: resourceSchemas.Set,
      Card: resourceSchemas.Card,
      User: resourceSchemas.User,
      GradingCompany: resourceSchemas.GradingCompany,
      CardPrice: resourceSchemas.CardPrice,
      GradedCardPrice: resourceSchemas.GradedCardPrice,
      CollectionItem: resourceSchemas.CollectionItem,
      TcgResponse: dataResponse("Tcg"),
      TcgListResponse: paginated("Tcg"),
      SetResponse: dataResponse("Set"),
      SetListResponse: paginated("Set"),
      CardResponse: dataResponse("Card"),
      CardDetailResponse: {
        type: "object",
        required: ["data"],
        properties: {
          data: {
            allOf: [
              ref("Card"),
              {
                type: "object",
                required: ["set", "tcg", "latest_prices", "collection"],
                properties: {
                  set: ref("Set"),
                  tcg: ref("Tcg"),
                  latest_prices: { type: "array", items: ref("CardPrice") },
                  collection: {
                    type: "object",
                    required: ["item_count", "total_quantity", "graded_quantity"],
                    properties: {
                      item_count: { type: "integer", minimum: 0 },
                      total_quantity: { type: "integer", minimum: 0 },
                      graded_quantity: { type: "integer", minimum: 0 },
                    },
                  },
                },
              },
            ],
          },
        },
      },
      CardListResponse: paginated("Card"),
      UserResponse: dataResponse("User"),
      UserListResponse: paginated("User"),
      UserDeleteResponse: {
        type: "object",
        required: ["status", "message"],
        properties: {
          status: { type: "string", enum: ["success"] },
          message: { type: "string" },
        },
      },
      GradingCompanyResponse: dataResponse("GradingCompany"),
      GradingCompanyListResponse: { type: "object", properties: { data: { type: "array", items: ref("GradingCompany") } } },
      GradingCompanyMutationResponse: mutationResponse("GradingCompany"),
      CardPriceResponse: dataResponse("CardPrice"),
      CardPriceListResponse: paginated("CardPrice"),
      GradedCardPriceResponse: dataResponse("GradedCardPrice"),
      GradedCardPriceListResponse: paginated("GradedCardPrice"),
      CardPriceStatisticsResponse: {
        type: "object",
        required: ["data"],
        properties: { data: ref("PriceStatistics") },
      },
      CardPriceVariationResponse: {
        type: "object",
        required: ["data"],
        properties: { data: ref("CardPriceVariation") },
      },
      CardPriceAggregationsResponse: {
        type: "object",
        required: ["data"],
        properties: { data: { type: "array", items: ref("PriceAggregation") } },
      },
      GradedPriceStatisticsResponse: {
        type: "object",
        required: ["data"],
        properties: { data: ref("PriceStatistics") },
      },
      GradedPriceVariationResponse: {
        type: "object",
        required: ["data"],
        properties: { data: ref("GradedPriceVariation") },
      },
      GradedPriceAggregationsResponse: {
        type: "object",
        required: ["data"],
        properties: { data: { type: "array", items: ref("PriceAggregation") } },
      },
      CollectionItemResponse: dataResponse("CollectionItem"),
      CollectionListResponse: paginated("CollectionItem"),
      CollectionMutationResponse: mutationResponse("CollectionItem"),
      CollectionStatsResponse: {
        type: "object",
        required: ["data"],
        properties: { data: ref("CollectionStats") },
      },
      CollectionValueResponse: {
        type: "object",
        required: ["data"],
        properties: { data: ref("CollectionValue") },
      },
      SyncSetsResponse: { type: "object", additionalProperties: true },
      SyncCardsResponse: { type: "object", additionalProperties: true },
      SyncPricesResponse: { type: "object", additionalProperties: true },
      SyncPipelineResponse: { type: "object", additionalProperties: true },
      GradedPricesImportResponse: {
        type: "object",
        required: ["summary"],
        properties: {
          summary: {
            type: "object",
            required: ["received", "created"],
            properties: {
              received: { type: "integer", minimum: 0 },
              created: { type: "integer", minimum: 0 },
            },
          },
        },
      },
      SyncJob: {
        type: "object",
        required: ["id", "type", "status", "queuedAt"],
        properties: {
          id: uuid,
          type: { type: "string", enum: ["sets", "cards", "prices", "pipeline"] },
          status: { type: "string", enum: ["queued", "running", "succeeded", "failed"] },
          attempts: { type: "integer", minimum: 0 },
          queuedAt: { type: "string", format: "date-time" },
          startedAt: { type: "string", format: "date-time", nullable: true },
          finishedAt: { type: "string", format: "date-time", nullable: true },
          durationMs: { type: "integer", minimum: 0, nullable: true },
          result: { nullable: true },
          error: { type: "object", nullable: true, properties: { code: { type: "string" }, message: { type: "string" } } },
        },
      },
      SyncJobResponse: dataResponse("SyncJob"),
      SyncJobsListResponse: { type: "object", properties: { activeJobId: { ...uuid, nullable: true }, data: { type: "array", items: ref("SyncJob") } } },
      CreateSyncJobRequest: { type: "object", required: ["type"], properties: { type: { type: "string", enum: ["sets", "cards", "prices", "pipeline"] } } },
      LoginResponse: {
        type: "object",
        required: ["status", "data"],
        properties: {
          status: { type: "string", enum: ["success"] },
          data: {
            type: "object",
            required: ["accessToken", "user"],
            properties: {
              accessToken: { type: "string", minLength: 1 },
              user: {
                type: "object",
                required: ["id", "username", "email"],
                properties: { id: uuid, username: { type: "string" }, email: { type: "string", format: "email" } },
              },
            },
          },
        },
      },
      RefreshResponse: {
        type: "object",
        required: ["status", "data"],
        properties: {
          status: { type: "string", enum: ["success"] },
          data: { type: "object", required: ["accessToken"], properties: { accessToken: { type: "string", minLength: 1 } } },
        },
      },
      LoginRequest: { type: "object", required: ["email", "password"], properties: { email: { type: "string", format: "email" }, password: { type: "string", format: "password" } } },
      CreateUserRequest: { type: "object", required: ["username", "email", "password"], additionalProperties: false, properties: { username: { type: "string", minLength: 3, maxLength: 50 }, email: { type: "string", format: "email", maxLength: 255 }, password: { type: "string", format: "password", minLength: 8, maxLength: 255 } } },
      UpdateUserRequest: { type: "object", minProperties: 1, additionalProperties: false, properties: { username: { type: "string", minLength: 3, maxLength: 50 }, email: { type: "string", format: "email", maxLength: 255 }, password: { type: "string", format: "password", minLength: 8, maxLength: 255 } } },
      CreateTcgRequest: { type: "object", required: ["name"], properties: { name: { type: "string", maxLength: 100 } } },
      UpdateTcgRequest: { type: "object", properties: { name: { type: "string", maxLength: 100 } } },
      CreateSetRequest: { type: "object", required: ["tcgId", "externalId", "name"], properties: { tcgId: uuid, externalId: { type: "string" }, name: { type: "string" }, code: { type: "string", nullable: true }, releaseDate: { type: "string", format: "date", nullable: true } } },
      UpdateSetRequest: { type: "object", properties: { tcgId: uuid, externalId: { type: "string", nullable: true }, name: { type: "string" }, code: { type: "string", nullable: true }, releaseDate: { type: "string", format: "date", nullable: true } } },
      CreateCardRequest: { type: "object", required: ["setId", "externalId", "name", "cardNumber"], properties: { setId: uuid, externalId: { type: "string" }, name: { type: "string" }, cardNumber: { type: "string" }, rarity: { type: "string", nullable: true }, imageUrl: { type: "string", format: "uri", nullable: true } } },
      UpdateCardRequest: { type: "object", properties: { setId: uuid, externalId: { type: "string", nullable: true }, name: { type: "string" }, cardNumber: { type: "string", nullable: true }, rarity: { type: "string", nullable: true }, imageUrl: { type: "string", format: "uri", nullable: true } } },
      CreateCardPriceRequest: { type: "object", required: ["condition", "price", "currency", "source"], properties: { condition: { type: "string" }, price: { type: "number", minimum: 0 }, currency: { type: "string" }, source: { type: "string" } } },
      CreateGradedCardPriceRequest: { type: "object", required: ["gradingCompanyId", "grade", "price", "currency", "source"], additionalProperties: false, properties: { gradingCompanyId: uuid, grade: { type: "number", minimum: 0, maximum: 10 }, price: { type: "number", minimum: 0 }, currency: { type: "string", minLength: 1, maxLength: 10 }, source: { type: "string", minLength: 1, maxLength: 100 } } },
      CreateCollectionItemRequest: { type: "object", required: ["cardId", "quantity", "condition"], properties: { cardId: uuid, quantity: { type: "integer", minimum: 1 }, condition: { type: "string" }, isGraded: { type: "boolean", default: false }, gradingCompanyId: { ...uuid, nullable: true }, grade: { type: "number", minimum: 0, maximum: 10, nullable: true } } },
      UpdateCollectionItemRequest: { type: "object", properties: { quantity: { type: "integer", minimum: 1 }, condition: { type: "string" }, isGraded: { type: "boolean" }, gradingCompanyId: { ...uuid, nullable: true }, grade: { type: "number", minimum: 0, maximum: 10, nullable: true } } },
      CreateGradingCompanyRequest: { type: "object", required: ["name"], properties: { name: { type: "string", maxLength: 50 } } },
      UpdateGradingCompanyRequest: { type: "object", properties: { name: { type: "string", maxLength: 50 } } },
      ImportGradedPricesRequest: { type: "object", required: ["prices"], additionalProperties: false, properties: { prices: { type: "array", minItems: 1, maxItems: 1000, items: ref("ImportGradedPriceItem") } } },
      ImportGradedPriceItem: { type: "object", required: ["cardId", "gradingCompanyId", "grade", "price", "currency", "source"], additionalProperties: false, properties: { cardId: uuid, gradingCompanyId: uuid, grade: { type: "number", minimum: 0, maximum: 10 }, price: { type: "number", minimum: 0 }, currency: { type: "string", minLength: 1, maxLength: 10 }, source: { type: "string", minLength: 1, maxLength: 100 }, recordedAt: { type: "string", format: "date-time" } } },
      PriceStatistics: { type: "object", required: ["total", "minimumPrice", "maximumPrice", "averagePrice"], properties: { total: { type: "integer", minimum: 0 }, minimumPrice: { type: "number", nullable: true }, maximumPrice: { type: "number", nullable: true }, averagePrice: { type: "number", nullable: true } } },
      PriceAggregation: { type: "object", required: ["period", "total", "minimumPrice", "maximumPrice", "averagePrice"], properties: { period: { type: "string" }, total: { type: "integer", minimum: 0 }, minimumPrice: { type: "number", nullable: true }, maximumPrice: { type: "number", nullable: true }, averagePrice: { type: "number", nullable: true } } },
      CardPriceVariation: { type: "object", required: ["currentPrice", "previousPrice", "absoluteVariation", "percentageVariation", "direction", "currency", "source", "condition", "currentRecordedAt", "previousRecordedAt"], properties: { currentPrice: { type: "number" }, previousPrice: { type: "number" }, absoluteVariation: { type: "number" }, percentageVariation: { type: "number", nullable: true }, direction: { type: "string", enum: ["up", "down", "unchanged"] }, currency: { type: "string" }, source: { type: "string" }, condition: { type: "string" }, currentRecordedAt: { type: "string", format: "date-time" }, previousRecordedAt: { type: "string", format: "date-time" } } },
      GradedPriceVariation: { type: "object", required: ["currentPrice", "previousPrice", "absoluteVariation", "percentageVariation", "direction", "currency", "source", "currentGradingCompanyId", "previousGradingCompanyId", "currentGrade", "previousGrade", "currentRecordedAt", "previousRecordedAt"], properties: { currentPrice: { type: "number" }, previousPrice: { type: "number" }, absoluteVariation: { type: "number" }, percentageVariation: { type: "number", nullable: true }, direction: { type: "string", enum: ["up", "down", "unchanged"] }, currency: { type: "string" }, source: { type: "string" }, currentGradingCompanyId: uuid, previousGradingCompanyId: uuid, currentGrade: { type: "number", minimum: 0, maximum: 10 }, previousGrade: { type: "number", minimum: 0, maximum: 10 }, currentRecordedAt: { type: "string", format: "date-time" }, previousRecordedAt: { type: "string", format: "date-time" } } },
      CollectionStats: { type: "object", required: ["summary", "byCondition", "bySet", "byTcg", "byGradingCompany"], properties: { summary: { type: "object", required: ["totalDistinctCards", "totalQuantity", "gradedQuantity", "ungradedQuantity"], properties: { totalDistinctCards: { type: "integer", minimum: 0 }, totalQuantity: { type: "integer", minimum: 0 }, gradedQuantity: { type: "integer", minimum: 0 }, ungradedQuantity: { type: "integer", minimum: 0 } } }, byCondition: { type: "array", items: { $ref: "#/components/schemas/CollectionStatsBreakdown" } }, bySet: { type: "array", items: { allOf: [{ $ref: "#/components/schemas/CollectionStatsBreakdown" }, { type: "object", properties: { setId: uuid, setName: { type: "string" }, setCode: { type: "string", nullable: true } } }] } }, byTcg: { type: "array", items: { allOf: [{ $ref: "#/components/schemas/CollectionStatsBreakdown" }, { type: "object", properties: { tcgId: uuid, tcgName: { type: "string" } } }] } }, byGradingCompany: { type: "array", items: { allOf: [{ $ref: "#/components/schemas/CollectionStatsBreakdown" }, { type: "object", properties: { gradingCompanyId: uuid, gradingCompanyName: { type: "string" } } }] } } } },
      CollectionStatsBreakdown: { type: "object", required: ["distinctCards", "totalQuantity"], properties: { distinctCards: { type: "integer", minimum: 0 }, totalQuantity: { type: "integer", minimum: 0 }, condition: { type: "string" }, setId: uuid, setName: { type: "string" }, setCode: { type: "string", nullable: true }, tcgId: uuid, tcgName: { type: "string" }, gradingCompanyId: uuid, gradingCompanyName: { type: "string" } } },
      CollectionValue: { type: "object", required: ["summary", "topValuedItems", "bySet", "byTcg", "byGradingCompany"], properties: { summary: { type: "object", required: ["totalEstimatedValue", "currency", "itemsEvaluatedCount", "itemsMissingPriceCount", "gradedItemsEvaluatedCount", "gradedItemsMissingPriceCount", "itemsUsingFallbackPriceCount", "gradedItemsUsingFallbackPriceCount"], properties: { totalEstimatedValue: { type: "number" }, currency: { type: "string" }, itemsEvaluatedCount: { type: "integer" }, itemsMissingPriceCount: { type: "integer" }, gradedItemsEvaluatedCount: { type: "integer" }, gradedItemsMissingPriceCount: { type: "integer" }, itemsUsingFallbackPriceCount: { type: "integer" }, gradedItemsUsingFallbackPriceCount: { type: "integer" } } }, topValuedItems: { type: "array", items: { $ref: "#/components/schemas/CollectionValueItem" } }, bySet: { type: "array", items: { $ref: "#/components/schemas/CollectionValueBySet" } }, byTcg: { type: "array", items: { $ref: "#/components/schemas/CollectionValueByTcg" } }, byGradingCompany: { type: "array", items: { $ref: "#/components/schemas/CollectionValueByGradingCompany" } } } },
      CollectionValueItem: { type: "object", properties: { id: uuid, cardId: uuid, cardName: { type: "string" }, cardNumber: { type: "string", nullable: true }, imageUrl: { type: "string", nullable: true }, setName: { type: "string" }, tcgName: { type: "string" }, quantity: { type: "integer" }, condition: { type: "string" }, isGraded: { type: "boolean" }, gradingCompanyId: { ...uuid, nullable: true }, gradingCompanyName: { type: "string", nullable: true }, grade: { type: "number", nullable: true }, unitPrice: { type: "number" }, priceMatch: { type: "string", enum: ["exact", "fallback"] }, totalItemValue: { type: "number" } } },
      CollectionValueBySet: { type: "object", properties: { setId: uuid, setName: { type: "string" }, setCode: { type: "string", nullable: true }, estimatedValue: { type: "number" }, totalQuantity: { type: "integer" } } },
      CollectionValueByTcg: { type: "object", properties: { tcgId: uuid, tcgName: { type: "string" }, estimatedValue: { type: "number" }, totalQuantity: { type: "integer" } } },
      CollectionValueByGradingCompany: { type: "object", properties: { gradingCompanyId: uuid, gradingCompanyName: { type: "string" }, estimatedValue: { type: "number" }, totalQuantity: { type: "integer" } } },
    },
  },
};

export function validateOpenApiDocument(document = openapiDocument) {
  if (document.openapi !== "3.0.3") {
    throw new Error("OpenAPI document must use version 3.0.3");
  }

  if (!document.info?.title || !document.info?.version) {
    throw new Error("OpenAPI document requires info.title and info.version");
  }

  if (!document.paths || Object.keys(document.paths).length === 0) {
    throw new Error("OpenAPI document must define at least one path");
  }

  for (const [path, pathItem] of Object.entries(document.paths)) {
    if (!path.startsWith("/")) {
      throw new Error(`Invalid OpenAPI path: ${path}`);
    }

    for (const [method, endpoint] of Object.entries(pathItem)) {
      if (!["get", "post", "put", "patch", "delete"].includes(method)) {
        continue;
      }

      if (!endpoint.operationId || !endpoint.responses) {
        throw new Error(`Incomplete OpenAPI operation: ${method} ${path}`);
      }
    }
  }

  return true;
}
