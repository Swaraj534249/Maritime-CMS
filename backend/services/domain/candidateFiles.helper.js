const { deleteFile } = require("../../middleware/upload");
const {
  buildVersionedPair,
  toPlainDoc,
} = require("../../utils/versionedDocument");

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

function processPresignedUploads(presigned = {}, existingDocs = {}) {
  const plainExisting =
    typeof existingDocs.toObject === "function"
      ? existingDocs.toObject()
      : existingDocs || {};

  const result = {};

  if (presigned.photo) result.photo = mapPresignedMeta(presigned.photo);
  if (presigned.aadhar) result.aadhar = mapPresignedMeta(presigned.aadhar);
  if (presigned.pan) result.pan = mapPresignedMeta(presigned.pan);

  const versioned = [
    "passport",
    "cdc",
    "indos",
    "visa",
    "medicalCertificate",
    "seamanBook",
    "resume",
  ];

  versioned.forEach((docType) => {
    if (presigned[docType]) {
      result[docType] = buildVersionedPair(
        plainExisting[docType],
        mapPresignedMeta(presigned[docType]),
      );
    }
  });

  return result;
}

/** Write versioned { main, old? } onto a mongoose documents subdoc. */
function assignVersionedDocument(target, docType, pair) {
  if (!target[docType]) target[docType] = {};
  target[docType].main = pair.main;
  if (pair.old) {
    target[docType].old = pair.old;
  } else {
    target[docType].old = undefined;
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
  assignVersionedDocument,
  toPlainDoc,
};
