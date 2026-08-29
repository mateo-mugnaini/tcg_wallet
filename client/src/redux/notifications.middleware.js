import { addNotification } from "./slices/notifications.slice.js";

const silentRejections = new Set([
  "auth/refresh/rejected",
  "auth/logout/rejected",
]);

const fieldLabels = {
  username: "Usuario",
  email: "Email",
  password: "Contraseña",
  confirmPassword: "Confirmación de contraseña",
};

export function getNotificationMessage(action) {
  const payload = action.payload || {};
  const errors = payload.details?.errors || payload.errors;

  if (Array.isArray(errors) && errors.length > 0) {
    return errors
      .map((error) => `${fieldLabels[error.field] || error.field || "Dato"}: ${error.message}`)
      .join(" ");
  }

  return payload.message || action.error?.message;
}

export function getNotificationTitle(action) {
  if (action.type === "users/create/rejected") return "No se pudo crear la cuenta";
  if (action.type === "auth/login/rejected") return "No se pudo iniciar sesión";
  if (action.type === "openings/openPacks/rejected") return "No se pudo abrir el sobre";
  if (action.payload?.status === 409) return "El registro ya existe";
  if (action.payload?.status === 429) return "Demasiados intentos";
  if (action.payload?.status === 400) return "Revisa los datos";
  return "No se pudo completar la solicitud";
}

export const notificationsMiddleware = ({ dispatch }) => (next) => (action) => {
  const result = next(action);
  const isRejectedRequest = typeof action.type === "string"
    && action.type.endsWith("/rejected")
    && !silentRejections.has(action.type)
    && !action.meta?.aborted;

  if (isRejectedRequest) {
    const message = getNotificationMessage(action);
    if (message && message !== "Rejected") {
      dispatch(addNotification({
        message,
        title: getNotificationTitle(action),
        type: "error",
      }));
    }
  }

  return result;
};
