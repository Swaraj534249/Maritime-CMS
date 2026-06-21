/**
 * Central place for the two sender identities and the temporary monitoring BCC.
 *
 * - Default From is the no-reply identity (SES_FROM_EMAIL), applied automatically
 *   by the mailer when no `from` is passed.
 * - adminFrom() is used when the SUPER ADMIN is the sender (e.g. feedback resolved).
 * - supportBcc() is a TEMPORARY blind copy on agent/agency-initiated mail so we can
 *   verify routing. Remove SUPPORT_BCC_EMAIL from the env to disable it later.
 */
function adminFrom() {
  return process.env.SES_ADMIN_FROM_EMAIL || process.env.SES_FROM_EMAIL;
}

function supportBcc() {
  const value = (process.env.SUPPORT_BCC_EMAIL || "").trim();
  return value ? [value] : [];
}

module.exports = { adminFrom, supportBcc };
