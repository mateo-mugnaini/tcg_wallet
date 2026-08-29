import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import app from "../src/app.js";
import { markShuttingDown, resetAppState } from "../src/runtime/app-state.js";

let server;
let baseUrl;

beforeAll(async () => {
  server = await new Promise((resolve) => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
  });

  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

afterEach(() => {
  resetAppState();
});

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  return {
    response,
    body: await response.json(),
  };
}

describe("API end-to-end contracts", () => {
  it("serves the health check with security headers", async () => {
    const { response, body } = await request("/api/health");

    expect(response.status).toBe(200);
    expect(body).toEqual({ status: "ok" });
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("x-request-id")).toMatch(/^[a-f0-9-]{36}$/);
  });

  it("propagates a safe incoming request id", async () => {
    const { response } = await request("/api/health", {
      headers: { "x-request-id": "test-request-123" },
    });

    expect(response.headers.get("x-request-id")).toBe("test-request-123");
  });

  it("serves the liveness check without requiring the database", async () => {
    const { response, body } = await request("/api/health/live");

    expect(response.status).toBe(200);
    expect(body).toEqual({ status: "ok" });
  });

  it("reports database readiness", async () => {
    const { response, body } = await request("/api/health/ready");

    expect(response.status).toBe(200);
    expect(body.status).toBe("ready");
    expect(body.checks.database).toBe("ok");
  });

  it("reports the application as unavailable while shutting down", async () => {
    markShuttingDown();

    const { response, body } = await request("/api/health/ready");

    expect(response.status).toBe(503);
    expect(body).toEqual({
      status: "not_ready",
      checks: { app: "shutting_down" },
    });
  });

  it("exposes aggregated HTTP metrics", async () => {
    const { response, body } = await request("/api/metrics");

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.metrics.requests.total).toBeGreaterThan(0);
    expect(body.metrics.endpoints).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ endpoint: "GET /health" }),
      ]),
    );
  });

  it("publishes the versioned OpenAPI contract", async () => {
    const { response, body } = await request("/api/docs/openapi.json");

    expect(response.status).toBe(200);
    expect(body.openapi).toBe("3.0.3");
    expect(body.info.title).toBe("TCG Wallet API");
    expect(body.paths["/cards/{cardId}/prices"]).toBeDefined();
    expect(body.paths["/sync/jobs"]).toBeDefined();
    expect(body.components.securitySchemes.bearerAuth.scheme).toBe("bearer");
  });

  it("rejects invalid login input before reaching the database", async () => {
    const { response, body } = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "not-an-email", password: "short" }),
    });

    expect(response.status).toBe(400);
    expect(body.status).toBe("error");
    expect(body).toEqual({
      status: "error",
      code: "VALIDATION_ERROR",
      message: "Revisa los datos ingresados.",
      errors: expect.arrayContaining([
        expect.objectContaining({ field: "email", message: "El email no es válido" }),
        expect.objectContaining({ field: "password", message: "La contraseña debe tener al menos 8 caracteres" }),
      ]),
    });
  });

  it("rejects unauthenticated collection access with 401", async () => {
    const { response, body } = await request("/api/collection-items");

    expect(response.status).toBe(401);
    expect(body).toEqual({
      status: "error",
      code: "APP_ERROR",
      message: "Token de autenticación requerido",
    });
  });
});
