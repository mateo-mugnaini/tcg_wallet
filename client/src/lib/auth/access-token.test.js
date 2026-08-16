import { describe, expect, it } from "vitest";
import { getAccessTokenExpiration } from "./access-token.js";

function createToken(payload) {
  const encodedPayload = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  return `header.${encodedPayload}.signature`;
}

describe("getAccessTokenExpiration", () => {
  it("decodifica la expiración de un JWT válido", () => {
    const expiration = 1_800_000_000;

    expect(getAccessTokenExpiration(createToken({ exp: expiration }))).toBe(expiration * 1000);
  });

  it("devuelve null si el token no contiene una expiración válida", () => {
    expect(getAccessTokenExpiration("not-a-jwt")).toBeNull();
    expect(getAccessTokenExpiration(createToken({ sub: "user-1" }))).toBeNull();
    expect(getAccessTokenExpiration("header.invalid.signature")).toBeNull();
  });
});
