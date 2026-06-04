const {
  getPresignedUploadUrl,
  getPresignUploadTtl,
} = require("./storage.service");
const {
  buildUploadMeta,
  resolveUploadKeyForRequest,
} = require("./uploadKey.service");

async function createPresignedPutUpload(
  req,
  { fieldname, originalName, contentType, fileSize },
) {
  const { key, filename } = resolveUploadKeyForRequest(req, {
    fieldname,
    originalName,
    contentType,
    fileSize,
  });

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
    expiresIn: getPresignUploadTtl(),
  };
}

module.exports = { createPresignedPutUpload };
