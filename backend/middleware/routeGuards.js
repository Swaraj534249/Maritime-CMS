const { authorize, checkAgencyStatus } = require("./authorization");

const STAFF_ROLES = ["AGENT", "AGENCY_ADMIN", "SUPER_ADMIN"];
const ADMIN_ROLES = ["AGENCY_ADMIN", "SUPER_ADMIN"];

/** Super admins skip agency active/subscription checks. */
function skipAgencyCheckForSuperAdmin(req, res, next) {
  if (req.user?.role === "SUPER_ADMIN") return next();
  return checkAgencyStatus(req, res, next);
}

function mountStaffAccess(router) {
  router.use(authorize(...STAFF_ROLES));
  router.use(skipAgencyCheckForSuperAdmin);
}

module.exports = {
  STAFF_ROLES,
  ADMIN_ROLES,
  skipAgencyCheckForSuperAdmin,
  mountStaffAccess,
};
