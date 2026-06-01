/**
 * Helpers for file metadata stored in MongoDB (path = S3 object key).
 */
const path = require("path");

function isS3ObjectKey(filePath) {
  if (!filePath || typeof filePath !== "string") return false;
  const normalized = filePath.replace(/\\/g, "/");
  if (path.isAbsolute(normalized)) return false;
  return true;
}

function isFileMetadata(value) {
  return (
    value &&
    typeof value === "object" &&
    typeof value.filename === "string" &&
    typeof value.path === "string"
  );
}

module.exports = {
  isS3ObjectKey,
  isFileMetadata,
};
 