const viteEnv = import.meta.env || {};
const apiBaseUrl = viteEnv.VITE_API_BASE_URL || "http://localhost:3000/api";

export const appEnv = Object.freeze({
  apiBaseUrl: apiBaseUrl.replace(/\/$/, ""),
});
