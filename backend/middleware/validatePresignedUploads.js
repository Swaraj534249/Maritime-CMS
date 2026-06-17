const { AppError } = require("../errors/AppError");
const { isKnownUploadFolder } = require("./uploadRules");
const {
  resolveTenantKeyForUpload,
  resolveUploadInfo,
  sanitizeFolderName,
} = require("./upload");

/** User profile/onboarding JSON bodies omit uploadFolder — derive from route. */
function resolveValidationUploadInfo(req, uploads) {
  const tenantKey = resolveTenantKeyForUpload(req);
  if (!tenantKey || tenantKey === "unknown") {
    throw new AppError(400, "Tenant context required for file upload");
  }

  const path = (req.originalUrl || req.url || "").split("?")[0];
  const userScoped = path.match(/\/users\/([^/]+)\/(profile|complete-onboarding)/);
  if (userScoped) {
    return {
      tenantKey,
      folderName: "users",
      subFolderName: sanitizeFolderName(userScoped[1]),
    };
  }

  const fromBody = resolveUploadInfo(req);
  if (fromBody.folderName !== "default" && fromBody.subFolderName !== "unknown") {
    return { ...fromBody, tenantKey };
  }

  // Entity PATCH often sends only s3_uploads — infer prefix from uploaded keys.
  const keys = Object.values(uploads || {})
    .map((meta) => meta?.key)
    .filter(Boolean);
  if (!keys.length) {
    return { ...fromBody, tenantKey };
  }

  const prefixes = new Set();
  for (const key of keys) {
    if (key.includes("..") || !key.startsWith(`${tenantKey}/`)) {
      throw new AppError(403, "Access denied");
    }
    const parts = key.split("/").filter(Boolean);
    if (parts.length < 3) {
      throw new AppError(400, "Invalid upload metadata");
    }
    const folderName = parts[1];
    if (!isKnownUploadFolder(folderName)) {
      throw new AppError(400, "Upload key does not match this record");
    }
    prefixes.add(`${parts[0]}/${parts[1]}/${parts[2]}/`);
  }

  if (prefixes.size !== 1) {
    throw new AppError(400, "Upload keys must share the same folder prefix");
  }

  const prefix = [...prefixes][0];
  const [, folderName, subFolderName] = prefix.replace(/\/$/, "").split("/");
  return { tenantKey, folderName, subFolderName };
}

/**
 * Ensures s3_uploads keys belong to the caller's tenant and expected subfolder.
 */
function validatePresignedUploads(req, res, next) {
  const raw = req.body?.s3_uploads;
  if (!raw) return next();

  let uploads;
  try {
    uploads = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return next(new AppError(400, "Invalid s3_uploads JSON"));
  }

  const uploadInfo = resolveValidationUploadInfo(req, uploads);
  req._uploadInfo = uploadInfo;
  const { tenantKey, folderName, subFolderName } = uploadInfo;
  const expectedPrefix = `${tenantKey}/${folderName}/${subFolderName}/`;

  if (folderName === "users") {
    const targetUserId =
      req.params?.id || req.body.userId || subFolderName;
    if (req.user.role === "AGENT" && String(targetUserId) !== String(req.user._id)) {
      return next(new AppError(403, "Cannot attach files for another user"));
    }
  }

  for (const meta of Object.values(uploads)) {
    const key = meta?.key;
    if (!key || typeof key !== "string") {
      return next(new AppError(400, "Invalid upload metadata"));
    }
    if (key.includes("..") || !key.startsWith(expectedPrefix)) {
      return next(new AppError(400, "Upload key does not match this record"));
    }
  }

  return next();
}

module.exports = { validatePresignedUploads };
