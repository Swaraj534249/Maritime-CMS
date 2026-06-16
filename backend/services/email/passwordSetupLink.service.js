const bcrypt = require("bcryptjs");
const PasswordResetToken = require("../../models/PasswordResetToken");
const { generateToken } = require("../../utils/GenerateToken");
const { sanitizeUser } = require("../../utils/SanitizeUser");

/**
 * Same mechanism as forgot-password: stores hashed token, returns plain token for URL.
 */
async function issuePasswordSetupLink(userDoc) {
  await PasswordResetToken.deleteMany({ user: userDoc._id });

  const plainToken = generateToken(sanitizeUser(userDoc), true);
  const hashedToken = await bcrypt.hash(plainToken, 10);

  const expiresMs = parseInt(process.env.OTP_EXPIRATION_TIME, 10);
  await new PasswordResetToken({
    user: userDoc._id,
    token: hashedToken,
    expiresAt: Date.now() + (Number.isFinite(expiresMs) ? expiresMs : 3600000),
  }).save();

  const origin = process.env.ORIGIN || "";
  const resetUrl = `${origin}/reset-password/${userDoc._id}/${plainToken}`;
  return { resetUrl, plainToken };
}

module.exports = { issuePasswordSetupLink };
