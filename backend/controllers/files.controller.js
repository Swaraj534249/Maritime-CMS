const { asyncHandler } = require("../middleware/asyncHandler");
const { AppError } = require("../errors/AppError");
const { resolveAccessUrl } = require("../aws/s3/fileAccess.service");
const { getS3ObjectStream } = require("../aws/s3/objectStream");
const { createPresignedPutUpload } = require("../aws/s3/presignUpload.service");
const { uploadFileToS3 } = require("../aws/s3/uploadKey.service");
const { isS3ObjectKey } = require("../utils/fileRef");
const { assertCanAccessFilePath } = require("../middleware/fileAccessAuth");

function resolveValidatedFilePath(req) {
  const filePath = assertCanAccessFilePath(req, req.query.path);
  if (!isS3ObjectKey(filePath)) {
    throw new AppError(400, "Invalid file path");
  }
  return filePath;
}

/** Redirect browser to presigned S3 download URL. */
exports.access = asyncHandler(async (req, res) => {
  const filePath = resolveValidatedFilePath(req);
  const url = await resolveAccessUrl(filePath);
  if (!url) throw new AppError(404, "File not found");
  return res.redirect(url);
});

/**
 * Stream file bytes through the API (auth cookie).
 * Use for <img src> — redirects from /files/access often fail in Avatar/img tags.
 */
exports.stream = asyncHandler(async (req, res) => {
  const filePath = resolveValidatedFilePath(req);

  let obj;
  try {
    obj = await getS3ObjectStream(filePath);
  } catch (err) {
    if (err?.name === "NoSuchKey" || err?.Code === "NoSuchKey") {
      throw new AppError(404, "File not found");
    }
    throw err;
  }
  if (!obj?.Body) throw new AppError(404, "File not found");

  res.setHeader("Content-Type", obj.ContentType || "application/octet-stream");
  res.setHeader("Cache-Control", "private, max-age=300");

  if (typeof obj.Body.pipe === "function") {
    return obj.Body.pipe(res);
  }

  const bytes = await obj.Body.transformToByteArray();
  return res.send(Buffer.from(bytes));
});

/**
 * Upload file via API → S3 (avoids S3 bucket CORS for browser PUT).
 * Multipart: file, uploadFolder, fieldname, + subfolder fields from uploadRules (tenant from JWT license).
 */
exports.upload = asyncHandler(async (req, res) => {
  if (!req.file?.buffer?.length) {
    throw new AppError(400, "file is required");
  }

  const fieldname = req.body.fieldname || req.file.fieldname;
  const result = await uploadFileToS3(req, {
    buffer: req.file.buffer,
    fieldname,
    originalName: req.file.originalname,
    contentType: req.file.mimetype,
    fileSize: req.file.size,
  });

  res.json(result);
});

/**
 * Presigned PUT URL (optional; requires S3 bucket CORS if used from browser).
 */
exports.presignUpload = asyncHandler(async (req, res) => {
  const result = await createPresignedPutUpload(req, req.body);
  res.json(result);
});

/** JSON presign for clients that need the URL without redirect. */
exports.presign = asyncHandler(async (req, res) => {
  const filePath = resolveValidatedFilePath(req);
  const url = await resolveAccessUrl(filePath);
  if (!url) throw new AppError(404, "File not found");
  res.json({ url, path: filePath });
});
