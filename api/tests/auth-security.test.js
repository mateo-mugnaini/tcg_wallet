import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const authMocks = vi.hoisted(() => ({
  findUserById: vi.fn(),
  findUserForAuthentication: vi.fn(),
  createRefreshToken: vi.fn(),
  revokeRefreshToken: vi.fn(),
  rotateRefreshToken: vi.fn(),
  findRefreshTokenByHash: vi.fn(),
}));

vi.mock("../src/repositories/user.repository.js", () => ({
  findUserById: authMocks.findUserById,
  findUserForAuthentication: authMocks.findUserForAuthentication,
}));

vi.mock("../src/repositories/refresh-token.repository.js", () => ({
  createRefreshToken: authMocks.createRefreshToken,
  revokeRefreshToken: authMocks.revokeRefreshToken,
  rotateRefreshToken: authMocks.rotateRefreshToken,
  findRefreshTokenByHash: authMocks.findRefreshTokenByHash,
}));

import {
  loginUser,
  refreshUserToken,
} from "../src/services/auth.service.js";
import { authenticate } from "../src/middlewares/auth.middleware.js";
import env from "../src/config/env.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../src/utils/jwt.js";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const USER = {
  id: USER_ID,
  username: "security-user",
  email: "security@example.com",
  role: "user",
};

let passwordHash;

beforeAll(async () => {
  passwordHash = await bcrypt.hash("correct-password", 12);
});

beforeEach(() => {
  vi.clearAllMocks();
  authMocks.createRefreshToken.mockResolvedValue({});
});

function invokeAuthenticate(authorization) {
  const req = {
    headers: authorization ? { authorization } : {},
  };

  return new Promise((resolve) => {
    authenticate(req, {}, (error) => resolve({ error, req }));
  });
}

describe("JWT y middleware de autenticación", () => {
  it("acepta un access token válido y conserva sub y role", async () => {
    const token = generateAccessToken(USER_ID, "user");
    const result = await invokeAuthenticate(`Bearer ${token}`);

    expect(result.error).toBeUndefined();
    expect(result.req.user).toEqual({ id: USER_ID, role: "user" });
  });

  it.each([
    ["sin token", undefined],
    ["esquema inválido", "Basic token"],
    ["token manipulado", `Bearer ${generateAccessToken(USER_ID, "user")}x`],
  ])("responde 401 para %s", async (_description, authorization) => {
    const result = await invokeAuthenticate(authorization);

    expect(result.error?.statusCode).toBe(401);
  });

  it("responde 401 para un access token expirado", async () => {
    const token = jwt.sign(
      { sub: USER_ID, role: "user" },
      env.jwt.accessSecret,
      { algorithm: "HS256", expiresIn: "-1s" },
    );

    const result = await invokeAuthenticate(`Bearer ${token}`);

    expect(result.error?.statusCode).toBe(401);
  });

  it.each([
    [{ sub: "not-a-uuid", role: "user" }, "sub inválido"],
    [{ sub: USER_ID, role: "owner" }, "role inválido"],
  ])("rechaza payload con %s", async (payload) => {
    const token = jwt.sign(payload, env.jwt.accessSecret, {
      algorithm: "HS256",
      expiresIn: "15m",
    });

    expect(() => verifyAccessToken(token)).toThrowError(
      expect.objectContaining({ statusCode: 401 }),
    );
  });

  it("rechaza algoritmos distintos de HS256", () => {
    const token = jwt.sign({ sub: USER_ID, role: "user" }, env.jwt.accessSecret, {
      algorithm: "HS384",
      expiresIn: "15m",
    });

    expect(() => verifyAccessToken(token)).toThrowError(
      expect.objectContaining({ statusCode: 401 }),
    );
  });

  it("emite un payload de access token mínimo con claims estándar", () => {
    const token = generateAccessToken(USER_ID, "user");
    const payload = jwt.decode(token);

    expect(Object.keys(payload).sort()).toEqual(["exp", "iat", "role", "sub"]);
  });

  it("rechaza un refresh token con payload inválido", () => {
    const token = jwt.sign({ sub: "not-a-uuid" }, env.jwt.refreshSecret, {
      algorithm: "HS256",
      expiresIn: "7d",
    });

    expect(() => verifyRefreshToken(token)).toThrowError(
      expect.objectContaining({ statusCode: 401 }),
    );
  });
});

describe("login resistente a enumeración y timing attacks", () => {
  const compareSpy = vi.spyOn(bcrypt, "compare");

  it("ejecuta bcrypt con un hash dummy cuando el usuario no existe", async () => {
    authMocks.findUserForAuthentication.mockResolvedValue(null);

    await expect(
      loginUser({ email: "missing@example.com", password: "wrong-password" }),
    ).rejects.toMatchObject({ statusCode: 401 });

    expect(compareSpy).toHaveBeenCalledWith(
      "wrong-password",
      expect.stringMatching(/^\$2b\$12\$/),
    );
  });

  it("responde credenciales inválidas para una contraseña incorrecta", async () => {
    authMocks.findUserForAuthentication.mockResolvedValue({
      ...USER,
      password: passwordHash,
    });

    await expect(
      loginUser({ email: USER.email, password: "wrong-password" }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("permite credenciales correctas sin filtrar la contraseña", async () => {
    authMocks.findUserForAuthentication.mockResolvedValue({
      ...USER,
      password: passwordHash,
    });

    const result = await loginUser({
      email: USER.email,
      password: "correct-password",
    });

    expect(result.user).toEqual({
      id: USER.id,
      username: USER.username,
      email: USER.email,
    });
    expect(JSON.stringify(result)).not.toContain("password");
    expect(authMocks.createRefreshToken).toHaveBeenCalledOnce();
  });
});

describe("rotación y reutilización de refresh tokens", () => {
  beforeEach(() => {
    authMocks.findUserById.mockResolvedValue(USER);
  });

  it("rota T1 a T2 conservando la sesión", async () => {
    const tokenT1 = generateRefreshToken(USER_ID);
    authMocks.rotateRefreshToken.mockResolvedValue({ status: "rotated" });

    const result = await refreshUserToken(tokenT1);

    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(result.refreshToken).not.toBe(tokenT1);
    expect(verifyRefreshToken(result.refreshToken).sub).toBe(USER_ID);
    expect(authMocks.rotateRefreshToken).toHaveBeenCalledOnce();
  });

  it("responde 401 y marca la familia ante reutilización de T1", async () => {
    const tokenT1 = generateRefreshToken(USER_ID);
    authMocks.rotateRefreshToken.mockResolvedValue({ status: "reused" });

    await expect(refreshUserToken(tokenT1)).rejects.toMatchObject({
      statusCode: 401,
      message: expect.stringContaining("reutilizado"),
    });
  });

  it("no convierte errores de base de datos en un 401 de autenticación", async () => {
    const tokenT1 = generateRefreshToken(USER_ID);
    const databaseError = new Error("database unavailable");
    authMocks.rotateRefreshToken.mockRejectedValue(databaseError);

    await expect(refreshUserToken(tokenT1)).rejects.toBe(databaseError);
  });
});
