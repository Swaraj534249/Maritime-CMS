/**
 * Run a paginated list query and its total count in a SINGLE MongoDB round-trip
 * using an aggregation `$facet`. Optionally populate ref fields afterwards.
 *
 * @param {object} opts
 * @param {import('mongoose').Model} opts.Model
 * @param {object} opts.matchFilter   - Mongo filter (e.g. from buildListQuery.queryFilter)
 * @param {object} opts.sort          - sort spec (e.g. { createdAt: -1 })
 * @param {number} opts.skip
 * @param {number} opts.limit
 * @param {Array|null} opts.populate  - mongoose populate spec applied to the page docs
 * @param {Array} opts.dataPipeline   - extra aggregation stages appended to the data branch
 * @param {object} opts.facets        - additional $facet branches (e.g. byStatus)
 * @returns {Promise<{ data: any[], totalRecords: number, facets: object }>}
 */
async function facetPaginate({
  Model,
  matchFilter = {},
  sort = {},
  skip = 0,
  limit = 10,
  populate = null,
  dataPipeline = [],
  facets = {},
}) {
  const sortStage = Object.keys(sort).length ? sort : { _id: -1 };

  // Aggregation `$match` does not cast like `find` does (e.g. agencyId string ->
  // ObjectId), so cast the filter through the schema first.
  let castedFilter = matchFilter;
  try {
    castedFilter = Model.find(matchFilter).cast(Model);
  } catch (err) {
    castedFilter = matchFilter;
  }

  const facetSpec = {
    data: [{ $sort: sortStage }, { $skip: skip }, { $limit: limit }, ...dataPipeline],
    totalCount: [{ $count: "count" }],
    ...facets,
  };

  const [result] = await Model.aggregate([
    { $match: castedFilter },
    { $facet: facetSpec },
  ]);

  let data = result?.data || [];
  if (populate && data.length) {
    data = await Model.populate(data, populate);
  }

  const totalRecords = result?.totalCount?.[0]?.count || 0;
  return { data, totalRecords, facets: result || {} };
}

module.exports = { facetPaginate };
