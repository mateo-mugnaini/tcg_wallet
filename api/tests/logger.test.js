import { describe, expect, it } from "vitest";

import { redact } from "../src/utils/logger.js";

describe("logger redaction", () => {
  it("redacts sensitive values recursively", () => {
    const value = redact({
      password: "hidden",
      nested: {
        token: "jwt-token",
        safe: "visible",
      },
      items: [{ apiKey: "secret-key", name: "card" }],
    });

    expect(value).toEqual({
      password: "[REDACTED]",
      nested: {
        token: "[REDACTED]",
        safe: "visible",
      },
      items: [{ apiKey: "[REDACTED]", name: "card" }],
    });
  });

  it("preserves non-sensitive metadata", () => {
    expect(redact({ requestId: "abc", status: 200 })).toEqual({
      requestId: "abc",
      status: 200,
    });
  });
});
