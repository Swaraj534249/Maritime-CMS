/**
 * Display labels: first letter uppercase, rest lowercase per word (e.g. "sourcing" → "Sourcing").
 */
export function formatDisplayLabel(value) {
  if (value == null || value === "") return null;
  return String(value)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join(" ");
}

/** Badge text on profile: user type, else role name */
export function getProfileBadgeLabel(user) {
  if (!user) return null;
  if (user.userType) return formatDisplayLabel(user.userType);
  if (user.role === "AGENCY_ADMIN") return "Agency Admin";
  if (user.role === "SUPER_ADMIN") return "Super Admin";
  if (user.role === "AGENT") return "Agent";
  return null;
}
