const { AppError } = require("../errors/AppError");
const { resolveTenantKeyForUpload } = require("./upload");

function normalizeS3Key(filePath) {
  if (!filePath || typeof filePath !== "string") {
    throw new AppError(400, "path query parameter is required");
  }
  const key = filePath.replace(/\\/g, "/").trim();
  if (!key || key.startsWith("/") || key.includes("..")) {
    throw new AppError(400, "Invalid file path");
  }
  return key;
}

/**
 * Ensures the authenticated user may read the given S3 object key.
 */
function assertCanAccessFilePath(req, filePath) {
  const key = normalizeS3Key(filePath);
  const segments = key.split("/").filter(Boolean);
  if (segments.length < 2) {
    throw new AppError(403, "Access denied");
  }

  const [objectTenant, folder, subFolder] = segments;

  if (req.user.role === "SUPER_ADMIN") {
    return key;
  }

  const userTenant = resolveTenantKeyForUpload(req);
  if (!userTenant || objectTenant !== userTenant) {
    throw new AppError(403, "Access denied");
  }

  if (folder === "users" && subFolder) {
    const isSelf = String(subFolder) === String(req.user._id);
    const isAdmin = req.user.role === "AGENCY_ADMIN";
    if (!isSelf && !isAdmin) {
      throw new AppError(403, "Access denied");
    }
  }

  return key;
}

function assertCanAccessFilePathMiddleware(req, res, next) {
  try {
    const filePath = req.query.path;
    assertCanAccessFilePath(req, filePath);
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  normalizeS3Key,
  assertCanAccessFilePath,
  assertCanAccessFilePathMiddleware,
};
