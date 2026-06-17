const { AppError } = require("../errors/AppError");

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message,
      ...(err.code ? { code: err.code } : {}),
      ...(err.extra && typeof err.extra === "object" ? err.extra : {}),
    });
  }

  console.error("Unhandled error:", err);
  const isDev = process.env.NODE_ENV === "development";
  return res.status(500).json({
    message: "Something went wrong. Please try again later.",
    ...(isDev && err.message ? { detail: err.message } : {}),
  });
}

module.exports = { errorHandler };
