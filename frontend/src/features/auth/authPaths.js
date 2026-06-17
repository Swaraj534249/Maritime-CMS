/**
 * Where to send the user right after a successful login (or auth refresh while on /login).
 */
export function getPostLoginPath(user) {
  if (!user) return "/login";

  if (user.role === "AGENT" && user.status === "verified") {
    return "/agent/onboarding";
  }

  return "/dashboard";
}
