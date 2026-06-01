const { AppError } = require("../errors/AppError");

/**
 * Parses req.body.s3_uploads (JSON string from FormData) into req.presignedUploads.
 * Used when the browser uploaded files via presigned PUT before POST/PATCH.
 */
function applyPresignedUploads(req, res, next) {
  const raw = req.body?.s3_uploads;
  if (!raw) return next();

  try {
    req.presignedUploads =
      typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return next(new AppError(400, "Invalid s3_uploads JSON"));
  }

  return next();
}

module.exports = { applyPresignedUploads };
