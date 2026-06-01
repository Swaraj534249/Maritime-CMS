/** First matching req.body field becomes the S3 subfolder (per entity type). */
module.exports.UPLOAD_RULES = {
  candidates: ["indosNumber"],
  vesselOwners: ["company_shortname", "company_name"],
  vessels: ["vesselname"],
  users: ["userId"],
};
