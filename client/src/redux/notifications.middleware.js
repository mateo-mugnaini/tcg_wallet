import { addNotification } from "./slices/notifications.slice.js";

const silentRejections = new Set([
  "auth/refresh/rejected",
  "auth/logout/rejected",
]);

export const notificationsMiddleware = ({ dispatch }) => (next) => (action) => {
  const result = next(action);
  const isRejectedRequest = typeof action.type === "string"
    && action.type.endsWith("/rejected")
    && !silentRejections.has(action.type)
    && !action.meta?.aborted;

  if (isRejectedRequest) {
    const message = action.payload?.message || action.error?.message;
    if (message && message !== "Rejected") {
      dispatch(addNotification({
        message,
        title: "No se pudo completar la solicitud",
        type: "error",
      }));
    }
  }

  return result;
};
