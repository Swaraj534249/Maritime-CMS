const { UPLOAD_RULES } = require("./uploadRules");
const { deleteObject } = require("../aws/s3/storage.service");
const { isS3ObjectKey } = require("../utils/fileRef");
const multer = require("multer");

const coerceToString = (value) => {
  if (value === undefined || value === null) return "";
  if (Array.isArray(value)) return String(value[0] ?? "");
  if (typeof value === "string") return value;
  try {
    return String(value);
  } catch (e) {
    return "";
  }
};

const sanitizeFolderName = (name) => {
  const s = coerceToString(name).trim();
  if (!s) return "unknown";
  return s.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
};

/** S3 tenant folder from agency labels (short name preferred). */
function tenantKeyFromAgencyFields({ shortName, name } = {}) {
  const raw = coerceToString(shortName).trim() || coerceToString(name).trim();
  if (!raw) return "";
  return sanitizeFolderName(raw);
}

/** Tenant segment for S3 keys — JWT agencyShortName, else agencyName. */
function resolveTenantKeyForUpload(req) {
  return tenantKeyFromAgencyFields({
    shortName: req.user?.agencyShortName,
    name: req.user?.agencyName,
  });
}

/** S3 key prefix: {agencyShortName|agencyName}/{entityType}/{businessKey}/ */
function resolveUploadInfo(req) {
  const tenantKey = resolveTenantKeyForUpload(req);
  const rawFolder = coerceToString(req.body?.uploadFolder) || "default";
  const folderName = sanitizeFolderName(rawFolder);

  const rules =
    UPLOAD_RULES[folderName] ||
    UPLOAD_RULES[
      Object.keys(UPLOAD_RULES).find(
        (key) => key.toLowerCase() === folderName,
      )
    ] ||
    [];

  let rawSubFolderValue = "unknown";
  for (const field of rules) {
    const value = coerceToString(req.body?.[field]);
    if (value) {
      rawSubFolderValue = value;
      break;
    }
  }

  const subFolderName = sanitizeFolderName(rawSubFolderValue);
  return { tenantKey, folderName, subFolderName };
}

function buildStoredFilename(req, file) {
  if (!req._uploadInfo) {
    req._uploadInfo = resolveUploadInfo(req);
  }
  const path = require("path");
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const ext = path.extname(file.originalname);
  const nameWithoutExt = path.basename(file.originalname, ext);
  const sanitizedName = nameWithoutExt
    .replace(/[^a-zA-Z0-9]/g, "-")
    .toLowerCase();
  return `${file.fieldname}-${uniqueSuffix}-${sanitizedName}${ext}`;
}

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = {
      "application/pdf": true,
      "application/msword": true,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": true,
    };
    if (allowed[file.mimetype]) cb(null, true);
    else cb(new Error("Resume must be PDF, DOC, or DOCX"), false);
  },
});

const parseFormFields = multer().none();

const parseResumeUpload = memoryUpload.single("resume");

const fileUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const uploadSingleFile = fileUpload.single("file");

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "File too large. Maximum size is 10MB per file",
      });
    }
    return res.status(400).json({ message: err.message });
  }
  if (err) return res.status(400).json({ message: err.message });
  next();
};

async function deleteFile(filePath) {
  if (!filePath || !isS3ObjectKey(filePath)) return false;
  try {
    await deleteObject(filePath);
    return true;
  } catch (error) {
    console.error(`Error deleting S3 object: ${filePath}`, error);
    return false;
  }
}

module.exports = {
  resolveTenantKeyForUpload,
  tenantKeyFromAgencyFields,
  sanitizeFolderName,
  resolveUploadInfo,
  buildStoredFilename,
  parseFormFields,
  parseResumeUpload,
  uploadSingleFile,
  handleMulterError,
  deleteFile,
};
