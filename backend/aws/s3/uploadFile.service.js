const { AppError } = require("../../errors/AppError");
const { buildObjectKey, uploadBuffer } = require("./storage.service");
const {
  resolveUploadInfo,
  buildStoredFilename,
} = require("../../middleware/upload");

const MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED_MIMES = {
  "image/png": true,
  "image/jpeg": true,
  "image/jpg": true,
  "application/pdf": true,
  "application/msword": true,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": true,
  "application/vnd.ms-excel": true,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": true,
};

function validateUploadMeta({ fieldname, originalName, contentType, fileSize }) {
  if (!fieldname || !originalName || !contentType) {
    throw new AppError(400, "fieldname, originalName, and contentType are required");
  }
  if (!ALLOWED_MIMES[contentType]) {
    throw new AppError(400, `Invalid file type: ${contentType}`);
  }
  const size = Number(fileSize) || 0;
  if (size > MAX_BYTES) {
    throw new AppError(400, "File too large. Maximum size is 10MB");
  }
}

function prepareUploadKey(req, { fieldname, originalName }) {
  validateUploadMeta({
    fieldname,
    originalName,
    contentType: req.body?.contentType || req.file?.mimetype,
    fileSize: req.body?.fileSize || req.file?.size,
  });

  req._uploadInfo = resolveUploadInfo(req);
  const filename = buildStoredFilename(req, {
    fieldname,
    originalname: originalName,
  });
  const { tenantKey, folderName, subFolderName } = req._uploadInfo;
  if (!tenantKey || tenantKey === "unknown") {
    throw new AppError(
      400,
      "Agency short name or name is required for file upload",
    );
  }
  const key = buildObjectKey(tenantKey, folderName, subFolderName, filename);
  return { key, filename };
}

async function uploadBufferToS3(req, buffer, meta) {
  validateUploadMeta(meta);
  const { key, filename } = prepareUploadKey(req, meta);
  await uploadBuffer(buffer, key, meta.contentType);
  return {
    key,
    filename,
    originalName: meta.originalName,
    mimetype: meta.contentType,
    contentType: meta.contentType,
    size: meta.fileSize,
    storage: "s3",
  };
}

module.exports = {
  ALLOWED_MIMES,
  MAX_BYTES,
  validateUploadMeta,
  prepareUploadKey,
  uploadBufferToS3,
};
