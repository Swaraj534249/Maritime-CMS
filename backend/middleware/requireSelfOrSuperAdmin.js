const { AppError } = require("../errors/AppError");

/**
 * Ensures :id matches the authenticated user, or caller is SUPER_ADMIN.
 */
function requireSelfOrSuperAdmin(req, res, next) {
  if (!req.user) {
    return next(new AppError(401, "Authentication required"));
  }
  if (req.user.role === "SUPER_ADMIN") {
    return next();
  }
  const targetId = req.params.id;
  if (!targetId || String(req.user._id) !== String(targetId)) {
    return next(new AppError(403, "You can only access your own profile"));
  }
  return next();
}

module.exports = { requireSelfOrSuperAdmin };
