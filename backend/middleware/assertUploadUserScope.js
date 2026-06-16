const { AppError } = require("../errors/AppError");
const { resolveUploadInfo } = require("./upload");

/** For uploadFolder `users`, only self (or admin) may set userId subfolder. */
function assertUploadUserScope(req, res, next) {
  const folder = (req.body?.uploadFolder || "").toLowerCase();
  if (folder !== "users") return next();

  const targetUserId = req.body.userId;
  if (!targetUserId) {
    return next(new AppError(400, "userId is required for profile uploads"));
  }

  if (req.user.role === "AGENT" && String(targetUserId) !== String(req.user._id)) {
    return next(new AppError(403, "Cannot upload files for another user"));
  }

  req._uploadInfo = resolveUploadInfo(req);
  return next();
}

module.exports = { assertUploadUserScope };
