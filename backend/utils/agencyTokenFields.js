/** Agency fields embedded in JWT and API user payloads. */
function applyAgencyFields(target, agency) {
  if (!agency) return target;
  const a = agency.toObject ? agency.toObject() : agency;
  if (a.name) target.agencyName = a.name;
  if (a.shortName) target.agencyShortName = a.shortName;
  if (a.email) target.agencyEmail = a.email;
  if (a.licenseNumber) target.licenseNumber = a.licenseNumber;
  return target;
}

/** Raw tenant label for S3 (short name, else agency name). */
function resolveAgencyTenantLabel(agencyOrUser) {
  if (!agencyOrUser) return "";
  const a = agencyOrUser.toObject ? agencyOrUser.toObject() : agencyOrUser;
  const short =
    a.agencyShortName || a.shortName || "";
  const name = a.agencyName || a.name || "";
  return String(short || name).trim();
}

module.exports = { applyAgencyFields, resolveAgencyTenantLabel };
