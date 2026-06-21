const User = require("../../models/User");

/**
 * Active agency-admin login emails for an agency. Used to blind-copy the agency
 * admin on candidate-facing mail.
 */
async function getAgencyAdminEmails(agencyId) {
  if (!agencyId) return [];
  const admins = await User.find({
    agencyId,
    role: "AGENCY_ADMIN",
    status: { $ne: "inactive" },
  })
    .select("email")
    .lean();
  return admins.map((a) => a.email).filter(Boolean);
}

module.exports = { getAgencyAdminEmails };
