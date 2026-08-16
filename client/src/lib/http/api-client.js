import { appEnv } from "../../app/config/env.js";
import { ApiError } from "./api-error.js";
import { toQueryString } from "./query-string.js";

const refreshPath = "/auth/refresh";
let getAccessToken = () => null;
let onAccessToken = () => {};
let onSessionExpired = () => {};
let refreshPromise = null;

export function configureApiClient({
  accessTokenGetter,
  accessTokenSetter,
  sessionExpiredHandler,
} = {}) {
  getAccessToken = accessTokenGetter || getAccessToken;
  onAccessToken = accessTokenSetter || onAccessToken;
  onSessionExpired = sessionExpiredHandler || onSessionExpired;
}

async function parseResponse(response) {
  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return null;

  return response.json();
}

function createResponseError(response, payload) {
  const errorData = payload?.error || payload;
  return new ApiError(errorData?.message || "La solicitud no pudo completarse", {
    status: response.status,
    code: errorData?.code || "API_ERROR",
    details: errorData,
  });
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = request(refreshPath, {
      method: "POST",
      skipRefresh: true,
    })
      .then((payload) => {
        const token = payload?.data?.accessToken;
        if (!token) throw new ApiError("La sesión no pudo renovarse", { status: 401 });
        onAccessToken(token);
        return token;
      })
      .catch((error) => {
        onSessionExpired(error);
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function request(path, options = {}) {
  const {
    method = "GET",
    body,
    query,
    skipRefresh = false,
    signal,
  } = options;
  const token = getAccessToken();
  const headers = new Headers(options.headers);

  headers.set("Accept", "application/json");
  if (body !== undefined) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response;
  try {
    response = await fetch(`${appEnv.apiBaseUrl}${path}${toQueryString(query)}`, {
      method,
      headers,
      credentials: "include",
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    throw new ApiError("No se pudo conectar con el backend", {
      code: "NETWORK_ERROR",
      details: error,
    });
  }

  const payload = await parseResponse(response);

  if (response.ok) return payload;

  if (response.status === 401 && !skipRefresh && path !== refreshPath) {
    await refreshAccessToken();
    return request(path, { ...options, skipRefresh: true });
  }

  if (response.status === 401 && path === refreshPath) onSessionExpired();
  throw createResponseError(response, payload);
}

export const api = Object.freeze({
  get: (path, options) => request(path, { ...options, method: "GET" }),
  post: (path, body, options) => request(path, { ...options, method: "POST", body }),
  put: (path, body, options) => request(path, { ...options, method: "PUT", body }),
  patch: (path, body, options) => request(path, { ...options, method: "PATCH", body }),
  delete: (path, options) => request(path, { ...options, method: "DELETE" }),
});
