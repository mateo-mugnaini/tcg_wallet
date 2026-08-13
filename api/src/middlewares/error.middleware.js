/* ====================================
          ERROR MIDDLEWARE
==================================== */
export function errorMiddleware(error, req, res, next) {
  console.error(error);

  const statusCode = error.statusCode || 500;

  return res.status(statusCode).json({
    status: "error",
    message: error.message || "Internal server error",
  });
}
