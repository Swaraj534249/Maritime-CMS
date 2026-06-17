const { normalizeStatus } = require("./userStatus");
const { applyAgencyFields } = require("./agencyTokenFields");

/**
 * Sanitize user object for client response
 * Removes sensitive fields like password
 */
exports.sanitizeUser = (user, agency) => {
  const userData = user.toObject ? user.toObject() : user;

  const sanitized = {
    _id: userData._id,
    name: userData.name,
    email: userData.email,
    role: userData.role,
    userType: userData.userType,
    industryType: userData.industryType,
    status: normalizeStatus(userData),
  };

  if (userData.agencyId) {
    sanitized.agencyId = userData.agencyId;
  }

  if (userData.agency) {
    sanitized.agency = userData.agency;
  }

  if (userData.agencyId && typeof userData.agencyId === "object") {
    applyAgencyFields(sanitized, userData.agencyId);
    sanitized.agencyId = userData.agencyId._id;
  } else {
    applyAgencyFields(sanitized, agency || userData);
  }

  if (userData.avatar) sanitized.avatar = userData.avatar;
  if (userData.phone) sanitized.phone = userData.phone;
  if (userData.alternatePhone) sanitized.alternatePhone = userData.alternatePhone;
  if (userData.dateOfBirth) sanitized.dateOfBirth = userData.dateOfBirth;
  if (userData.gender) sanitized.gender = userData.gender;
  if (userData.address) sanitized.address = userData.address;
  if (userData.bloodGroup) sanitized.bloodGroup = userData.bloodGroup;
  if (userData.aadharNumber) sanitized.aadharNumber = userData.aadharNumber;
  if (userData.panNumber) sanitized.panNumber = userData.panNumber;
  if (userData.aadhar) sanitized.aadhar = userData.aadhar;
  if (userData.pan) sanitized.pan = userData.pan;
  if (userData.socialMedia) sanitized.socialMedia = userData.socialMedia;

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
 */
exports.sanitizeUserForToken = (user, agency) => {
  const userData = user.toObject ? user.toObject() : user;

  const tokenPayload = {
    _id: userData._id,
    email: userData.email,
    role: userData.role,
  };

  const agencyId =
    userData.agencyId?._id || userData.agencyId || agency?._id;
  if (agencyId) {
    tokenPayload.agencyId = agencyId;
  }

  if (userData.industryType) {
    tokenPayload.industryType = userData.industryType;
  }

  const agencyDoc =
    agency ||
    (userData.agencyId && typeof userData.agencyId === "object"
      ? userData.agencyId
      : null);
  applyAgencyFields(tokenPayload, agencyDoc);

  return tokenPayload;
};
