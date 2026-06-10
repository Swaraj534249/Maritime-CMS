const Rank = require("../../models/Rank");
const { AppError } = require("../../errors/AppError");
const { assertUniqueWithinAgency } = require("../../utils/tenantUniqueness");
const { toTitleCase } = require("../../utils/textCase");
const { buildListQuery } = require("../../utils/ListQueryBuilder");
const { buildListResponse } = require("../../utils/ListResponseBuilder");

function resolveAgencyId(req) {
  if (req.user?.role !== "SUPER_ADMIN" && req.user?.agencyId) {
    return req.user.agencyId;
  }
  return req.body?.agencyId || null;
}

function scopedQuery(req, extra = {}) {
  const query = { ...extra };
  if (req.user?.role !== "SUPER_ADMIN" && req.user?.agencyId) {
    query.agencyId = req.user.agencyId;
  }
  return query;
}

async function create(req) {
  const rankName = toTitleCase(req.body?.rankName);
  if (!rankName) throw new AppError(400, "Rank name is required");

  const agencyId = resolveAgencyId(req);
  if (!agencyId) throw new AppError(400, "Agency context is required");

  await assertUniqueWithinAgency({
    Model: Rank,
    agencyId,
    checks: [
      {
        field: "rankName",
        value: rankName,
        message: "This rank already exists in your agency",
        caseInsensitive: true,
      },
    ],
  });

  try {
    return await Rank.create({
      agencyId,
      addedBy: req.user?._id,
      rankName,
    });
  } catch (error) {
    if (error?.code === 11000) {
      throw new AppError(400, "This rank already exists in your agency");
    }
    throw new AppError(500, "Error adding rank, please try again later");
  }
}

async function list(req) {
  const {
    page = 1,
    limit = 10,
    sortField = "rankName",
    sortOrder = "asc",
    searchValue = "",
    activeOnly,
    all,
  } = req.query;

  const extraFilter = {};
  if (req.user?.role !== "SUPER_ADMIN" && req.user?.agencyId) {
    extraFilter.agencyId = req.user.agencyId;
  }
  if (activeOnly === "true") extraFilter.isActive = true;

  if (all === "true") {
    const filter = { ...extraFilter };
    const data = await Rank.find(filter).sort({ rankName: 1 }).lean();
    return buildListResponse({
      data,
      page: 1,
      pageSize: data.length || 1,
      totalRecords: data.length,
      searchValue,
      sortField,
      sortOrder,
    });
  }

  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const pageSizeNumber = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

  const { queryFilter, skip, sort } = buildListQuery({
    Model: Rank,
    searchValue,
    searchFields: ["rankName"],
    page: pageNumber,
    pageSize: pageSizeNumber,
    sortField,
    sortOrder,
    extraFilter,
  });

  const [data, totalRecords] = await Promise.all([
    Rank.find(queryFilter).skip(skip).limit(pageSizeNumber).sort(sort).lean(),
    Rank.countDocuments(queryFilter),
  ]);

  return buildListResponse({
    data,
    page: pageNumber,
    pageSize: pageSizeNumber,
    totalRecords,
    searchValue,
    sortField,
    sortOrder,
  });
}

async function updateById(req) {
  const { id } = req.params;
  const existing = await Rank.findOne(scopedQuery(req, { _id: id }));
  if (!existing) throw new AppError(404, "Rank not found");

  const data = {};

  if (req.body?.rankName !== undefined) {
    const rankName = toTitleCase(req.body.rankName);
    if (!rankName) throw new AppError(400, "Rank name is required");
    await assertUniqueWithinAgency({
      Model: Rank,
      agencyId: existing.agencyId,
      excludeId: id,
      checks: [
        {
          field: "rankName",
          value: rankName,
          message: "This rank already exists in your agency",
          caseInsensitive: true,
        },
      ],
    });
    data.rankName = rankName;
  }

  if (req.body?.isActive !== undefined) {
    data.isActive = !!req.body.isActive;
  }

  return Rank.findByIdAndUpdate(id, data, { new: true });
}

async function toggleStatus(req) {
  const existing = await Rank.findOne(scopedQuery(req, { _id: req.params.id }));
  if (!existing) throw new AppError(404, "Rank not found");

  existing.isActive = !existing.isActive;
  await existing.save();
  return existing;
}

module.exports = { create, list, updateById, toggleStatus };
