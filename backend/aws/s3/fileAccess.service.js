const {
  getPresignedDownloadUrl,
  getPresignDownloadTtl,
} = require("./storage.service");
const { isS3ObjectKey, isFileMetadata } = require("../../utils/fileRef");

async function resolveAccessUrl(filePath) {
  if (!filePath || !isS3ObjectKey(filePath)) return null;
  return getPresignedDownloadUrl(filePath, getPresignDownloadTtl());
}

function isBsonValue(value) {
  if (value == null || typeof value !== "object") return false;
  if (value instanceof Date) return true;
  if (Buffer.isBuffer(value)) return true;
  if (typeof value.toHexString === "function") return true;
  if (value._bsontype) return true;
  return false;
}

function isImageFile(file) {
  const mime = file.mimetype || file.contentType || "";
  return (
    mime.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(file.path || file.filename || "")
  );
}

/** Adds storage + presigned url for images (list avatars). PDFs use /files/* on demand. */
async function enrichFileMetadata(file) {
  if (!isFileMetadata(file)) return file;

  const out = {
    ...file,
    storage: file.storage || "s3",
  };

  if (isS3ObjectKey(file.path) && isImageFile(file)) {
    try {
      out.url = await getPresignedDownloadUrl(file.path, getPresignDownloadTtl());
    } catch (err) {
      if (err?.name !== "NoSuchKey" && err?.Code !== "NoSuchKey") {
        console.warn("[enrichDeep] presign:", file.path, err.message);
      }
    }
  }

  return out;
}

async function enrichDeep(value) {
  if (value == null) return value;

  if (Array.isArray(value)) {
    return Promise.all(value.map((item) => enrichDeep(item)));
  }

  if (isBsonValue(value)) {
    return typeof value.toHexString === "function"
      ? value.toHexString()
      : value;
  }

  if (typeof value === "object") {
    if (isFileMetadata(value)) return enrichFileMetadata(value);
    if (typeof value.toObject === "function") {
      return enrichDeep(value.toObject());
    }
    const out = {};
    for (const [key, nested] of Object.entries(value)) {
      out[key] = await enrichDeep(nested);
    }
    return out;
  }

  return value;
}

module.exports = { resolveAccessUrl, enrichDeep, enrichFileMetadata };
