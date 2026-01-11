/**
 * Sanitize user object for client response
 * Removes sensitive fields like password
 */
exports.sanitizeUser = (user) => {
  // Handle both mongoose documents and plain objects
  const userData = user.toObject ? user.toObject() : user;

  const sanitized = {
    _id: userData._id,
    name: userData.name,
    email: userData.email,
    role: userData.role,
    userType: userData.userType,
    industryType: userData.industryType,
    isVerified: userData.isVerified,
    isActive: userData.isActive,
  };

  if (userData.agencyId) {
    sanitized.agencyId = userData.agencyId;
  }

  if (userData.agency) {
    sanitized.agency = userData.agency;
  }

  if (userData.avatar) {
    sanitized.avatar = userData.avatar;
  }

  if (userData.lastLoginAt) {
    sanitized.lastLoginAt = userData.lastLoginAt;
  }

  if (userData.createdAt) {
    sanitized.createdAt = userData.createdAt;
  }

  if (userData.updatedAt) {
    sanitized.updatedAt = userData.updatedAt;
  }

  return sanitized;
};

/**
 * Sanitize user object for JWT token
 * Only includes essential fields needed for authentication and authorization
 * CRITICAL: Must include role, agencyId, and industryType for proper multi-tenancy
 */
exports.sanitizeUserForToken = (user) => {
  // Handle both mongoose documents and plain objects
  const userData = user.toObject ? user.toObject() : user;

  const tokenPayload = {
    _id: userData._id,
    email: userData.email,
    role: userData.role,
  };

  // CRITICAL: Include agencyId for agency-based authorization
  // Super admins won't have agencyId, so it's optional
  if (userData.agencyId) {
    tokenPayload.agencyId = userData.agencyId;
  }

  if (userData.industryType) {
    tokenPayload.industryType = userData.industryType;
  }

  return tokenPayload;
};