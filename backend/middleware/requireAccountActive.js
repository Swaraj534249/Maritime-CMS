const User = require("../models/User");
const { AppError } = require("../errors/AppError");
const { STATUS, normalizeStatus } = require("../utils/userStatus");

/** Paths/methods allowed while agent status is `verified` (onboarding). */
function isVerifiedAgentAllowed(req) {
  const url = req.originalUrl || req.url || "";
  if (url.includes("/complete-onboarding")) return true;
  if (url.includes("/check-auth")) return true;
  if (url.includes("/logout")) return true;
  if (url.includes("/files/upload")) return true;
  if (url.includes("/files/presign-upload")) return true;
  if (url.includes("/files/stream")) return true;
  if (url.includes("/files/access")) return true;
  if (/^\/users\/[^/]+$/.test(url.split("?")[0]) && req.method === "GET") {
    return true;
  }
  return false;
}

/**
 * Loads current account status from DB and blocks inactive / incomplete agents.
 * Attach after verifyToken on protected API routes.
 */
async function requireAccountActive(req, res, next) {
  try {
    if (!req.user?._id) {
      return next(new AppError(401, "Authentication required"));
    }

    const dbUser = await User.findById(req.user._id)
      .select("status role")
      .lean();
    if (!dbUser) {
      return next(new AppError(401, "User not found"));
    }

    const status = normalizeStatus(dbUser);
    req.user.status = status;
    req.user.role = dbUser.role;

    if (status === STATUS.INACTIVE) {
      return next(
        new AppError(
          403,
          "Your account is deactivated. Please contact your administrator.",
        ),
      );
    }

    if (status === STATUS.UNVERIFIED && dbUser.role !== "SUPER_ADMIN") {
      return next(
        new AppError(
          403,
          "Please set your password using the link sent to your email.",
        ),
      );
    }

    if (
      dbUser.role === "AGENT" &&
      status === STATUS.VERIFIED &&
      !isVerifiedAgentAllowed(req)
    ) {
      return next(
        new AppError(403, "Please complete your profile setup to continue."),
      );
    }

    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = { requireAccountActive };
