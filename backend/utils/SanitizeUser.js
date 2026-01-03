exports.sanitizeUser = (user) => {
  const sanitized = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    userType: user.userType,
    isVerified: user.isVerified,
    isActive: user.isActive,
  };

  if (user.agencyId) {
    sanitized.agencyId = user.agencyId;
  }

  if (user.avatar) {
    sanitized.avatar = user.avatar;
  }

  if (user.lastLoginAt) {
    sanitized.lastLoginAt = user.lastLoginAt;
  }

  return sanitized;
};

exports.sanitizeUserForToken = (user) => {
  const tokenPayload = {
    _id: user._id,
    email: user.email,
    role: user.role,
  };
  if (user.agencyId) {
    tokenPayload.agencyId = user.agencyId;
  }

  return tokenPayload;
};