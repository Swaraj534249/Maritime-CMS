const { buildVersionedPair } = require("../../utils/versionedDocument");
const {
  mapPresignedMeta,
  assignVersionedField,
  cleanupPresignedUploads,
  toPlainDoc,
} = require("./presignedMeta.helper");

function processPresignedUploads(presigned = {}, existing = null) {
  const plainExisting = toPlainDoc(existing);

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

module.exports = {
  processPresignedUploads,
  cleanupPresignedUploads,
  mapPresignedMeta,
  assignVersionedField,
};
