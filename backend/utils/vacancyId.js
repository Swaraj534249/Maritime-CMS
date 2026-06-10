function normalizeSegment(value, fallback, maxLen) {
  const raw = (value || fallback || "")
    .trim()
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
  return (raw || fallback).slice(0, maxLen);
}

/**
 * Globally-unique prefix: {AGENCY}-{OWNER}.
 * Agency short names are unique globally and owner short names are unique within
 * an agency, so the prefix is unique across the whole platform.
 */
function buildVacancyPrefix({ agency = {}, owner = {} } = {}) {
  const agencySeg = normalizeSegment(agency.shortName, agency.name || "AG", 8);
  const ownerSeg = normalizeSegment(
    owner.company_shortname,
    owner.company_name || "VO",
    8,
  );
  return `${agencySeg}-${ownerSeg}`;
}

function formatVacancyId(prefix, sequenceNumber) {
  return `${prefix}-${String(sequenceNumber).padStart(4, "0")}`;
}

module.exports = { buildVacancyPrefix, formatVacancyId };
