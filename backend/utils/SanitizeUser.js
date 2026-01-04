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
    isVerified: userData.isVerified,
    isActive: userData.isActive,
  };

  // Add optional fields if they exist
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
 * Only includes essential fields needed for authentication
 * CRITICAL: Must include role and agencyId for authorization
 */
exports.sanitizeUserForToken = (user) => {
  // Handle both mongoose documents and plain objects
  const userData = user.toObject ? user.toObject() : user;

  const tokenPayload = {
    _id: userData._id,
    email: userData.email,
    role: userData.role, // CRITICAL: Always include role
  };

  // CRITICAL: Include agencyId for agency-based authorization
  // Super admins won't have agencyId, so it's optional
  if (userData.agencyId) {
    tokenPayload.agencyId = userData.agencyId;
  }

  return tokenPayload;
};