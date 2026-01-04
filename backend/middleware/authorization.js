exports.authorize = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      // User must be authenticated first (verifyToken should run before this)
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          message: "Access denied. Insufficient permissions",
        });
      }

      next();
    } catch (error) {
      console.error("Authorization error:", error);
      return res.status(500).json({ message: "Authorization check failed" });
    }
  };
};

exports.requireSuperAdmin = exports.authorize("SUPER_ADMIN");
exports.requireAgencyAdmin = exports.authorize("SUPER_ADMIN", "AGENCY_ADMIN");
exports.requireAgent = exports.authorize("SUPER_ADMIN", "AGENCY_ADMIN", "AGENT");

/**
 * Middleware to ensure user can only access their own agency's data
 * Validates that agencyId in request matches user's agencyId
 * Super admins bypass this check
 */
exports.checkAgencyAccess = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Super admins can access any agency
    if (req.user.role === "SUPER_ADMIN") {
      return next();
    }

    const requestedAgencyId =
      req.params.agencyId ||
      req.body.agencyId ||
      req.query.agencyId;

    // If no specific agency is requested, use user's agency
    if (!requestedAgencyId) {
      req.agencyId = req.user.agencyId;
      return next();
    }

    // Check if user is trying to access a different agency
    if (req.user.agencyId && req.user.agencyId.toString() !== requestedAgencyId.toString()) {
      return res.status(403).json({
        message: "Access denied. You can only access your agency's data",
      });
    }

    req.agencyId = req.user.agencyId;
    next();
  } catch (error) {
    console.error("Agency access check error:", error);
    return res.status(500).json({ message: "Access check failed" });
  }
};

/**
 * Middleware to validate agency ownership of a resource
 * Use this when resource has agencyId field
 * Super admins bypass this check
 */
exports.validateResourceOwnership = (Model, resourceIdParam = "id") => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const resourceId = req.params[resourceIdParam];

      if (!resourceId) {
        return res.status(400).json({ message: "Resource ID is required" });
      }

      const resource = await Model.findById(resourceId);

      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }

      // Super admins can access any resource
      if (req.user.role === "SUPER_ADMIN") {
        req.resource = resource;
        return next();
      }

      // Check if resource belongs to user's agency
      if (!resource.agencyId) {
        return res.status(500).json({
          message: "Resource does not have agency association",
        });
      }

      if (resource.agencyId.toString() !== req.user.agencyId.toString()) {
        return res.status(403).json({
          message: "Access denied. Resource belongs to another agency",
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      console.error("Resource ownership validation error:", error);
      return res.status(500).json({ message: "Validation failed" });
    }
  };
};

/**
 * Middleware to check if agency is active
 * Super admins bypass this check
 */
exports.checkAgencyStatus = async (req, res, next) => {
  try {
    // Super admins don't need agency status check
    if (req.user && req.user.role === "SUPER_ADMIN") {
      return next();
    }

    const Agency = require("../models/Agency");

    if (!req.user || !req.user.agencyId) {
      return next();
    }

    const agency = await Agency.findById(req.user.agencyId);

    if (!agency) {
      return res.status(404).json({ message: "Agency not found" });
    }

    if (!agency.isActive) {
      return res.status(403).json({
        message: "Your agency account is inactive. Please contact support",
      });
    }

    // Check subscription expiry
    if (agency.subscriptionExpiresAt && agency.subscriptionExpiresAt < new Date()) {
      return res.status(403).json({
        message: "Your agency subscription has expired. Please renew",
      });
    }

    req.agency = agency;
    next();
  } catch (error) {
    console.error("Agency status check error:", error);
    return res.status(500).json({ message: "Status check failed" });
  }
};

/**
 * Combined middleware for agent routes
 * Checks both authorization and agency access
 */
exports.agentRouteAccess = [
  exports.requireAgencyAdmin, // Must be SUPER_ADMIN or AGENCY_ADMIN
  // Agency access will be checked in controller based on role
];