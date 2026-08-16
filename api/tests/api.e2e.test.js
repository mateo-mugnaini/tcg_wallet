import { afterAll, beforeAll, describe, expect, it } from "vitest";

import app from "../src/app.js";

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
  });

  it("rejects invalid login input before reaching the database", async () => {
    const { response, body } = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "not-an-email", password: "short" }),
    });

    expect(response.status).toBe(400);
    expect(body.status).toBe("error");
    expect(body.message).toContain("inválidos");
  });

  it("rejects unauthenticated collection access with 401", async () => {
    const { response, body } = await request("/api/collection-items");

    expect(response.status).toBe(401);
    expect(body).toEqual({
      status: "error",
      message: "Token de autenticación requerido",
    });
  });
});
