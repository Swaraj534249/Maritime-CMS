const { AppError } = require("../../errors/AppError");
const { buildObjectKey, getPresignedUploadUrl } = require("./storage.service");
const {
  validateUploadMeta,
  buildUploadMeta,
} = require("./uploadKey.service");
const {
  resolveUploadInfo,
  buildStoredFilename,
} = require("../../middleware/upload");

async function createPresignedPutUpload(
  req,
  { fieldname, originalName, contentType, fileSize },
) {
  validateUploadMeta({ fieldname, originalName, contentType, fileSize });

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
  const uploadUrl = await getPresignedUploadUrl(key, contentType);

  return {
    method: "PUT",
    uploadUrl,
    ...buildUploadMeta({
      key,
      filename,
      originalName,
      contentType,
      size: fileSize,
    }),
    expiresIn:
      Number(process.env.S3_PRESIGN_UPLOAD_EXPIRES_SECONDS) || 900,
  };
}

module.exports = { createPresignedPutUpload };
