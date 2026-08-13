/* ====================================
              ERROR DE APLICACIÓN
==================================== */
export function createAppError(message, statusCode) {
  const error = new Error(message);

  error.statusCode = statusCode;

  return error;
}
