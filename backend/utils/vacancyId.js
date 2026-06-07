function buildVacancyPrefix(agency) {
  const raw = (agency.shortName || agency.name || "AG")
    .trim()
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
  return (raw || "AG").slice(0, 8);
}

function formatVacancyId(prefix, sequenceNumber) {
  return `${prefix}-VAC-${String(sequenceNumber).padStart(4, "0")}`;
}

module.exports = { buildVacancyPrefix, formatVacancyId };
