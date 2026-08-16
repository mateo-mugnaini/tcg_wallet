/* ====================================
          ERROR MIDDLEWARE
==================================== */
export function errorMiddleware(error, req, res, _next) {
  console.error(error);

  if (error.statusCode) {
    return res.status(error.statusCode).json({
      status: "error",
      message: error.message,
    });
  }

  return res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
}
