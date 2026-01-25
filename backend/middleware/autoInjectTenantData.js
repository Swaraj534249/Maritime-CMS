/**
 * Middleware to automatically inject tenant data (agencyId, createdBy, industryType)
 * from the authenticated user's token into request body
 * 
 * This ensures multi-tenancy is enforced automatically without manual assignment in controllers
 */

exports.autoInjectTenantData = (options = {}) => {
  const {
    includeAgencyId = true,
    includeCreatedBy = true,
    includeIndustryType = true,
    allowOverride = false, // If true, allows req.body to override injected values
  } = options;

  return (req, res, next) => {
    try {
      // Only inject on POST and PUT/PATCH requests
      if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
        return next();
      }

      // User must be authenticated
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      console.log('🔧 Auto-Inject Tenant Data - Before:', {
        method: req.method,
        body: req.body,
        user: {
          _id: req.user._id,
          role: req.user.role,
          agencyId: req.user.agencyId,
          industryType: req.user.industryType,
        },
      });

      // Inject agencyId (if user has one and not already set or override allowed)
      if (includeAgencyId && req.user.agencyId) {
        if (!req.body.agencyId || allowOverride === false) {
          req.body.agencyId = req.user.agencyId;
        }
      }

      // Inject createdBy (only on POST - creating new records)
      if (includeCreatedBy && req.method === 'POST') {
        if (!req.body.createdBy || allowOverride === false) {
          req.body.createdBy = req.user._id;
        }
      }

      // Inject industryType (if user has one and not already set or override allowed)
      if (includeIndustryType && req.user.industryType) {
        if (!req.body.industryType || allowOverride === false) {
          req.body.industryType = req.user.industryType;
        }
      }

      console.log('✅ Auto-Inject Tenant Data - After:', {
        agencyId: req.body.agencyId || 'Not injected',
        createdBy: req.body.createdBy || 'Not injected',
        industryType: req.body.industryType || 'Not injected',
      });

      next();
    } catch (error) {
      console.error("Auto-inject tenant data error:", error);
      return res.status(500).json({ message: "Tenant data injection failed" });
    }
  };
};