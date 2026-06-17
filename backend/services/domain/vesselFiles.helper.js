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
  if (presigned.vessel_image) {
    result.vessel_image = mapPresignedMeta(presigned.vessel_image);
  }
  if (presigned.vessel_documents) {
    result.vessel_documents = buildVersionedPair(
      plainExisting?.vessel_documents,
      mapPresignedMeta(presigned.vessel_documents),
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
