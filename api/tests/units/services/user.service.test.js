import { describe, expect, it, vi } from "vitest";

import {
  getUserByEmail,
  getUserById,
} from "../../../src/services/user.service.js";

import * as userRepository from "../../../src/repositories/user.repository.js";

/* ====================================
          OBTENER USUARIO POR ID
==================================== */
describe("getUserById", () => {
  it("debería obtener un usuario por ID", async () => {
    const user = {
      id: "f5caa047-0f2b-4f48-831a-f1c2500d654d",
      username: "test_user",
      email: "test_user@tgcwallet.com",
    };

    vi.spyOn(userRepository, "findUserById").mockResolvedValue(user);

    const result = await getUserById(user.id);

    expect(result).toEqual(user);
  });
});

/* ====================================
        OBTENER USUARIO POR EMAIL
==================================== */
describe("getUserByEmail", () => {
  it("debería obtener un usuario por email", async () => {
    const user = {
      id: "f5caa047-0f2b-4f48-831a-f1c2500d654d",
      username: "test_user",
      email: "test_user@tgcwallet.com",
    };

    vi.spyOn(userRepository, "findUserByEmail").mockResolvedValue(user);

    const result = await getUserByEmail(user.email);

    expect(result).toEqual(user);
  });
});
