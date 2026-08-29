import { describe, expect, it } from "vitest";
import {
  getNotificationMessage,
  getNotificationTitle,
} from "./notifications.middleware.js";

describe("notification messages", () => {
  it("turns validation issues into a readable message", () => {
    expect(getNotificationMessage({
      type: "users/create/rejected",
      payload: {
        details: {
          errors: [
            { field: "username", message: "El usuario es obligatorio" },
            { field: "email", message: "El email no es válido" },
          ],
        },
      },
    })).toBe("Usuario: El usuario es obligatorio Email: El email no es válido");
  });

  it("uses a specific title for account creation errors", () => {
    expect(getNotificationTitle({ type: "users/create/rejected", payload: { status: 409 } }))
      .toBe("No se pudo crear la cuenta");
  });
});
