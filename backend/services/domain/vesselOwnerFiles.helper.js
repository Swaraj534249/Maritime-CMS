const { deleteFile } = require("../../middleware/upload");
const { buildVersionedPair } = require("../../utils/versionedDocument");

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

function processPresignedUploads(presigned = {}, existing = null) {
  const plainExisting =
    existing && typeof existing.toObject === "function"
      ? existing.toObject()
      : existing;

  const result = {};
  if (presigned.company_logo) {
    result.company_logo = mapPresignedMeta(presigned.company_logo);
  }
  if (presigned.contract) {
    result.contract = buildVersionedPair(
      plainExisting?.contract,
      mapPresignedMeta(presigned.contract),
    );
  }
  if (presigned.license) {
    result.license = buildVersionedPair(
      plainExisting?.license,
      mapPresignedMeta(presigned.license),
    );
  }
  return result;
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
  processPresignedUploads,
  cleanupPresignedUploads,
  mapPresignedMeta,
  assignVersionedField,
};
