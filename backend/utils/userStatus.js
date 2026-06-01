const STATUS = Object.freeze({
  UNVERIFIED: "unverified",
  VERIFIED: "verified",
  ACTIVE: "active",
  INACTIVE: "inactive",
});

/** Resolve stored user status (defaults to unverified). */
function normalizeStatus(user) {
  if (!user) return STATUS.UNVERIFIED;
  if (user.status) return user.status;
  return STATUS.UNVERIFIED;
}

/** Password set (verified) or fully onboarded (active) may sign in. */
function canLogin(status) {
  return status === STATUS.ACTIVE || status === STATUS.VERIFIED;
}

function isFullyActive(status) {
  return status === STATUS.ACTIVE;
}

function needsAgentOnboarding(user) {
  return user?.role === "AGENT" && normalizeStatus(user) === STATUS.VERIFIED;
}

module.exports = {
  STATUS,
  normalizeStatus,
  canLogin,
  isFullyActive,
  needsAgentOnboarding,
};
