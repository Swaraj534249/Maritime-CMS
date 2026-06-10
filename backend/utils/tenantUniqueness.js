const { AppError } = require("../errors/AppError");

function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeCheckValue(value, field) {
  if (value === undefined || value === null) return null;
  const str = String(value).trim();
  if (!str) return null;
  if (field === "panNumber" || field === "passportNumber") {
    return str.toUpperCase();
  }
  if (field === "email") {
    return str.toLowerCase();
  }
  return str;
}

/**
 * Ensure no other document in the same agency (tenant) has the same field value.
 * @param {object} opts
 * @param {import('mongoose').Model} opts.Model
 * @param {import('mongoose').Types.ObjectId|string} opts.agencyId
 * @param {import('mongoose').Types.ObjectId|string} [opts.excludeId] - current record on update
 * @param {{ field: string, value: unknown, message: string }[]} opts.checks
 */
async function assertUniqueWithinAgency({ Model, agencyId, excludeId, checks }) {
  if (!agencyId) return;

  for (const { field, value, message, caseInsensitive } of checks) {
    const normalized = normalizeCheckValue(value, field);
    if (!normalized) continue;

    const query = { agencyId };
    query[field] = caseInsensitive
      ? new RegExp(`^${escapeRegExp(normalized)}$`, "i")
      : normalized;
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existing = await Model.findOne(query).select("_id").lean();
    if (existing) {
      throw new AppError(400, message);
    }
  }
}

module.exports = { assertUniqueWithinAgency, normalizeCheckValue };
