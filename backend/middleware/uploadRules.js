/** First matching req.body field becomes the S3 subfolder (per entity type). */
const UPLOAD_RULES = {
  candidates: ["indosNumber"],
  vesselOwners: ["company_shortname", "company_name"],
  vessels: ["vesselname"],
  users: ["userId"],
};

function getRuleFieldsForFolder(folderName) {
  if (UPLOAD_RULES[folderName]) return UPLOAD_RULES[folderName];
  const matchKey = Object.keys(UPLOAD_RULES).find(
    (key) => key.toLowerCase() === folderName,
  );
  return matchKey ? UPLOAD_RULES[matchKey] : null;
}

function isKnownUploadFolder(folderName) {
  return getRuleFieldsForFolder(folderName) != null;
}

module.exports = {
  UPLOAD_RULES,
  getRuleFieldsForFolder,
  isKnownUploadFolder,
};
