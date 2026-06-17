const { parseFormFields } = require("./upload");
const { applyPresignedUploads } = require("./applyPresignedUploads");
const { validatePresignedUploads } = require("./validatePresignedUploads");

/** Standard PATCH chain for entity forms that attach s3_uploads metadata. */
const presignedPatchChain = [
  parseFormFields,
  applyPresignedUploads,
  validatePresignedUploads,
];

module.exports = { presignedPatchChain };
