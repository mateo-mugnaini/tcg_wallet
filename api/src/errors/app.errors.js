/* ====================================
              ERROR DE APLICACIÓN
==================================== */
export function createAppError(message, statusCode) {
  const error = new Error(message);

  error.statusCode = statusCode;

  console.log("🚀 ~ createAppError ~ error:", error);
  return error;
}
