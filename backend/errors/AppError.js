/**
 * Operational error with HTTP status — throw from services, map in errorHandler.
 */
class AppError extends Error {
  constructor(statusCode, message, { code, extra } = {}) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    /** Optional fields merged into JSON (e.g. { success: false } for legacy clients) */
    this.extra = extra;
  }
}

module.exports = { AppError };
