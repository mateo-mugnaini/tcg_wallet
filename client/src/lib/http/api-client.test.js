import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { configureApiClient, request } from "./api-client.js";

function jsonResponse(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => "application/json" },
    json: vi.fn().mockResolvedValue(payload),
  };
}

describe("api client", () => {
  beforeEach(() => {
    configureApiClient({
      accessTokenGetter: () => "old-token",
      accessTokenSetter: vi.fn(),
      sessionExpiredHandler: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renueva el token y reintenta una petición que responde 401", async () => {
    const accessTokenSetter = vi.fn();
    const sessionExpiredHandler = vi.fn();
    configureApiClient({
      accessTokenGetter: () => "old-token",
      accessTokenSetter,
      sessionExpiredHandler,
    });

    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ error: { message: "Token expirado" } }, 401))
      .mockResolvedValueOnce(jsonResponse({ data: { accessToken: "new-token" } }))
      .mockResolvedValueOnce(jsonResponse({ data: [{ id: "card-1" }] }));

    await expect(request("/cards")).resolves.toEqual({ data: [{ id: "card-1" }] });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0][1].headers.get("Authorization")).toBe("Bearer old-token");
    expect(fetchMock.mock.calls[2][1].headers.get("Authorization")).toBe("Bearer old-token");
    expect(accessTokenSetter).toHaveBeenCalledWith("new-token");
    expect(sessionExpiredHandler).not.toHaveBeenCalled();
  });

  it("normaliza un error de red sin filtrar el error nativo", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));

    await expect(request("/health")).rejects.toMatchObject({
      code: "NETWORK_ERROR",
      message: "No se pudo conectar con el backend",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
