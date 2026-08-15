/* ====================================
            ERROR DE APLICACIÓN
==================================== */

export class AppError extends Error {
  constructor(message, statusCode = 500, code = "APP_ERROR", details = null) {
    super(message);

    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;

    Error.captureStackTrace?.(this, AppError);
  }
}

/* ====================================
        CREAR ERROR DE APLICACIÓN
==================================== */

export function createAppError(
  message,
  statusCode = 500,
  code = "APP_ERROR",
  details = null,
) {
  return new AppError(message, statusCode, code, details);
}
