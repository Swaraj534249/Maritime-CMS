function buildTicketPrefix(agency) {
  const raw = (agency.shortName || agency.name || "AG")
    .trim()
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
  return (raw || "AG").slice(0, 8);
}

function formatTicketId(prefix, sequenceNumber) {
  return `${prefix}-${String(sequenceNumber).padStart(4, "0")}`;
}

module.exports = { buildTicketPrefix, formatTicketId };
