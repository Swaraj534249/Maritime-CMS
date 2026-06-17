/**
 * Reusable status-count aggregation for list dropdowns.
 * Returns the total and a per-status breakdown in a single round-trip.
 *
 * @param {object} opts
 * @param {import('mongoose').Model} opts.Model
 * @param {object} opts.matchFilter - Mongo filter (agency + search scope)
 * @param {string} opts.field       - field to group by (e.g. "status", "currentStatus")
 * @returns {Promise<{ total: number, byStatus: Record<string, number> }>}
 */
async function computeStatusCounts({ Model, matchFilter = {}, field = "status" }) {
  // Aggregation $match doesn't cast like find(); cast through the schema.
  let castedFilter = matchFilter;
  try {
    castedFilter = Model.find(matchFilter).cast(Model);
  } catch (err) {
    castedFilter = matchFilter;
  }

  const [res] = await Model.aggregate([
    { $match: castedFilter },
    {
      $facet: {
        total: [{ $count: "count" }],
        byStatus: [{ $group: { _id: `$${field}`, count: { $sum: 1 } } }],
      },
    },
  ]);

  const byStatus = {};
  (res?.byStatus || []).forEach((s) => {
    if (s._id) byStatus[s._id] = s.count;
  });

  return { total: res?.total?.[0]?.count || 0, byStatus };
}

module.exports = { computeStatusCounts };
