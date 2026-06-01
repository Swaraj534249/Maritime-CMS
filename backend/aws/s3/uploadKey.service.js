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
    throw new AppError(
      400,
      "fieldname, originalName, and contentType are required",
    );
  }
  if (!ALLOWED_MIMES[contentType]) {
    throw new AppError(400, `Invalid file type: ${contentType}`);
  }
  const size = Number(fileSize) || 0;
  if (size > MAX_BYTES) {
    throw new AppError(400, "File too large. Maximum size is 10MB");
  }
}

function buildUploadMeta({ key, filename, originalName, contentType, size }) {
  return {
    key,
    filename,
    originalName,
    mimetype: contentType,
    contentType,
    size,
    storage: "s3",
  };
}

async function uploadFileToS3(
  req,
  { buffer, fieldname, originalName, contentType, fileSize },
) {
  validateUploadMeta({ fieldname, originalName, contentType, fileSize });

  req._uploadInfo = resolveUploadInfo(req);
  const { tenantKey, folderName, subFolderName } = req._uploadInfo;
  if (!tenantKey || tenantKey === "unknown") {
    throw new AppError(
      400,
      "Agency short name or name is required for file upload",
    );
  }
  if (subFolderName === "unknown") {
    throw new AppError(
      400,
      "Cannot upload files until the record exists with a unique folder key (e.g. indosNumber, company_shortname, vesselname)",
    );
  }
  const filename = buildStoredFilename(req, {
    fieldname,
    originalname: originalName,
  });
  const key = buildObjectKey(tenantKey, folderName, subFolderName, filename);

  await uploadBuffer(buffer, key, contentType);

  return buildUploadMeta({
    key,
    filename,
    originalName,
    contentType,
    size: fileSize,
  });
}

module.exports = {
  validateUploadMeta,
  buildUploadMeta,
  uploadFileToS3,
  ALLOWED_MIMES,
  MAX_BYTES,
};
