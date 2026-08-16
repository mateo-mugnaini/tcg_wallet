import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { validateResponse } from "../src/middlewares/validate-response.middleware.js";

describe("validateResponse middleware", () => {
  it("restores res.json before forwarding an invalid response", () => {
    const next = vi.fn();
    const originalJson = vi.fn();
    const response = {
      statusCode: 201,
      json: originalJson,
    };
    const request = {
      requestId: "request-test",
      method: "POST",
      originalUrl: "/collection-items",
    };

    validateResponse(z.object({ data: z.string() }))(request, response, next);
    const wrappedJson = response.json;
    response.json({ data: 123 });

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "La respuesta generada por el servidor no cumple con el contrato esperado",
        statusCode: 500,
      }),
    );
    expect(response.json).not.toBe(wrappedJson);

    response.json({ status: "error", message: "Error controlado" });
    expect(originalJson).toHaveBeenCalledWith({
      status: "error",
      message: "Error controlado",
    });
  });

  it("does not replace an application error with a success-contract error", () => {
    const next = vi.fn();
    const originalJson = vi.fn();
    const response = {
      statusCode: 400,
      json: originalJson,
    };
    const request = {
      requestId: "request-error-test",
      method: "POST",
      originalUrl: "/collection-items",
    };

    validateResponse(z.object({ data: z.string() }))(request, response, next);
    next.mockClear();
    response.json({ status: "error", message: "Una carta no gradada no puede tener una calificaciÃ³n" });

    expect(next).not.toHaveBeenCalled();
    expect(originalJson).toHaveBeenCalledWith({
      status: "error",
      message: "Una carta no gradada no puede tener una calificaciÃ³n",
    });
  });
});
