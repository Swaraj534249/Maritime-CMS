const { deleteFile } = require("../../middleware/upload");
const { toPlainDoc } = require("../../utils/versionedDocument");

function mapPresignedMeta(meta) {
  return {
    filename: meta.filename,
    originalName: meta.originalName,
    path: meta.key,
    storage: meta.storage || "s3",
    mimetype: meta.mimetype || meta.contentType,
    size: meta.size,
    uploadedAt: new Date(),
  };
}

function assignVersionedField(target, fieldName, pair) {
  target[fieldName] = target[fieldName] || {};
  target[fieldName].main = pair.main;
  if (pair.old) {
    target[fieldName].old = pair.old;
  } else {
    target[fieldName].old = undefined;
  }
}

async function cleanupPresignedUploads(presigned = {}) {
  const keys = Object.values(presigned)
    .map((m) => m?.key)
    .filter(Boolean);
  await Promise.all(keys.map((k) => deleteFile(k)));
}

module.exports = {
  mapPresignedMeta,
  assignVersionedField,
  assignVersionedDocument: assignVersionedField,
  cleanupPresignedUploads,
  toPlainDoc,
};
