const { mapPresignedMeta } = require("./presignedMeta.helper");

function applyProfileFileUploads(presigned = {}, existing = {}) {
  const updates = {};
  if (presigned.avatar) updates.avatar = mapPresignedMeta(presigned.avatar);
  if (presigned.aadhar) updates.aadhar = mapPresignedMeta(presigned.aadhar);
  if (presigned.pan) updates.pan = mapPresignedMeta(presigned.pan);
  return updates;
}

module.exports = { applyProfileFileUploads };
