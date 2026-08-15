import { EventEmitter } from "node:events";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const databaseMocks = vi.hoisted(() => ({
  connect: vi.fn(),
}));

vi.mock("../src/config/database.js", () => ({
  default: {
    connect: databaseMocks.connect,
  },
}));

import { pokemonTcgRequest } from "../src/integrations/pokemon-tcg/pokemon-tcg.client.js";
import { syncExecutionLock } from "../src/middlewares/sync-lock.middleware.js";

beforeEach(() => {
  databaseMocks.connect.mockResolvedValue({
    query: vi.fn(async (query) =>
      query.includes("pg_try_advisory_lock")
        ? { rows: [{ acquired: true }] }
        : { rows: [] },
    ),
    release: vi.fn(),
  });
});

describe("sync hardening", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("rechaza una segunda sincronización mientras la primera está activa", async () => {
    const firstResponse = new EventEmitter();
    const secondResponse = new EventEmitter();
    const thirdResponse = new EventEmitter();
    let firstError;
    let secondError;
    let thirdError;

    await syncExecutionLock({}, firstResponse, (error) => {
      firstError = error;
    });
    await syncExecutionLock({}, secondResponse, (error) => {
      secondError = error;
    });

    expect(firstError).toBeUndefined();
    expect(secondError).toMatchObject({
      statusCode: 409,
      code: "SYNC_IN_PROGRESS",
    });

    firstResponse.emit("finish");

    await syncExecutionLock({}, thirdResponse, (error) => {
      thirdError = error;
    });

    expect(thirdError).toBeUndefined();
    thirdResponse.emit("finish");
  });

  it("aborta requests externas que superan el timeout", async () => {
    vi.useFakeTimers();

    const fetchMock = vi.fn(
      (_url, request) =>
        new Promise((_resolve, reject) => {
          request.signal.addEventListener("abort", () => {
            const error = new Error("aborted");
            error.name = "AbortError";
            reject(error);
          });
        }),
    );

    vi.stubGlobal("fetch", fetchMock);

    const request = pokemonTcgRequest("/cards", { timeoutMs: 100 });
    const rejection = expect(request).rejects.toMatchObject({
      statusCode: 504,
      code: "POKEMON_TCG_API_TIMEOUT",
    });

    await vi.advanceTimersByTimeAsync(100);

    await rejection;
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
