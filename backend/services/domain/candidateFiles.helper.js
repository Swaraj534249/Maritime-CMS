const { buildVersionedPair } = require("../../utils/versionedDocument");
const {
  mapPresignedMeta,
  assignVersionedDocument,
  cleanupPresignedUploads,
  toPlainDoc,
} = require("./presignedMeta.helper");

function processPresignedUploads(presigned = {}, existingDocs = {}) {
  const plainExisting = toPlainDoc(existingDocs) || {};

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

module.exports = {
  processPresignedUploads,
  cleanupPresignedUploads,
  mapPresignedMeta,
  assignVersionedDocument,
  toPlainDoc,
};
