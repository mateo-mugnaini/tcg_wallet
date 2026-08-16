const viteEnv = import.meta.env || {};
const configuredApiBaseUrl = typeof viteEnv.VITE_API_BASE_URL === "string"
  ? viteEnv.VITE_API_BASE_URL.trim().replace(/\/$/, "")
  : "";
const isProduction = Boolean(viteEnv.PROD);
const apiBaseUrl = configuredApiBaseUrl || (isProduction ? "" : "http://localhost:3000/api");
const hasValidApiBaseUrl = /^https?:\/\//i.test(apiBaseUrl);
const configurationError = !hasValidApiBaseUrl
  ? "Configura VITE_API_BASE_URL con la URL pública del backend antes de desplegar."
  : null;

export const appEnv = Object.freeze({
  apiBaseUrl: apiBaseUrl.replace(/\/$/, ""),
  configurationError,
  isProduction,
});
