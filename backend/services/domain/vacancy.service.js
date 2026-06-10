const Vacancy = require("../../models/Vacancy");
const Agency = require("../../models/Agency");
const Vessel = require("../../models/Vessel");
const VesselOwner = require("../../models/VesselOwner");
const User = require("../../models/User");
const {
  queueVacancyCreatedEmail,
} = require("../email/vacancyNotification.service");
const { AppError } = require("../../errors/AppError");
const { buildListQuery } = require("../../utils/ListQueryBuilder");
const { buildListResponse } = require("../../utils/ListResponseBuilder");
const { facetPaginate } = require("../../utils/facetList");
const { computeStatusCounts } = require("../../utils/statusCounts");
const { buildVacancyPrefix, formatVacancyId } = require("../../utils/vacancyId");

const { VACANCY_STATUSES } = Vacancy;

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

const POPULATE = [
  { path: "vesselOwner", select: "company_name company_shortname" },
  { path: "vessel", select: "vesselname imo_Number vesseltype flag" },
  { path: "addedBy", select: "name" },
  { path: "updatedBy", select: "name" },
];

/** Only the creator or an agency admin / super admin may edit or close. */
function assertCanManage(req, vacancy) {
  const role = req.user?.role;
  if (role === "AGENCY_ADMIN" || role === "SUPER_ADMIN") return;
  if (vacancy.addedBy && String(vacancy.addedBy) === String(req.user?._id)) {
    return;
  }
  throw new AppError(
    403,
    "Only the agent who created this vacancy or an agency admin can modify it",
  );
}

async function loadVesselForAgency(vesselId, agencyId) {
  if (!vesselId) throw new AppError(400, "Vessel is required");
  const vessel = await Vessel.findById(vesselId).lean();
  if (!vessel) throw new AppError(404, "Vessel not found");
  if (
    agencyId &&
    vessel.agencyId &&
    String(vessel.agencyId) !== String(agencyId)
  ) {
    throw new AppError(403, "Vessel belongs to another agency");
  }
  return vessel;
}

async function create(req) {
  const agencyId = resolveAgencyId(req);
  if (!agencyId) throw new AppError(400, "Agency context is required");

  const {
    vesselOwner,
    vessel,
    rank,
    openings,
    salary,
    signOnDate,
    contractDurationMonths,
    remarks,
  } = req.body;

  if (!vesselOwner) throw new AppError(400, "Vessel owner is required");
  if (!vessel) throw new AppError(400, "Vessel is required");
  if (!rank?.trim()) throw new AppError(400, "Rank is required");

  const vesselDoc = await loadVesselForAgency(vessel, agencyId);
  if (String(vesselDoc.vesselOwner) !== String(vesselOwner)) {
    throw new AppError(400, "Vessel does not belong to the selected vessel owner");
  }

  // Vessel type / flag default from the vessel but can be overridden.
  const vesselType =
    req.body.vesselType?.trim() || vesselDoc.vesseltype || "";
  const flag = req.body.flag?.trim() || vesselDoc.flag || "";

  const openingsNum = Math.max(1, parseInt(openings, 10) || 1);

  // Agency-global counter keeps sequenceNumber unique (existing index).
  const updatedAgency = await Agency.findByIdAndUpdate(
    agencyId,
    { $inc: { vacancyCounter: 1 } },
    { new: true },
  );
  if (!updatedAgency) throw new AppError(404, "Agency not found");
  const sequenceNumber = updatedAgency.vacancyCounter;

  // Owner-scoped counter drives the human-readable id (e.g. TDF-0001).
  const owner = await VesselOwner.findByIdAndUpdate(
    vesselOwner,
    { $inc: { vacancyCounter: 1 } },
    { new: true },
  );
  if (!owner) throw new AppError(404, "Vessel owner not found");

  const vacancyId = formatVacancyId(
    buildVacancyPrefix({ agency: updatedAgency, owner }),
    owner.vacancyCounter,
  );

  try {
    const created = await Vacancy.create({
      agencyId,
      addedBy: req.user?._id,
      vacancyId,
      sequenceNumber,
      vesselOwner,
      vessel,
      vesselType,
      flag,
      rank: rank.trim(),
      openings: openingsNum,
      filledCount: 0,
      salary: salary?.trim?.() || salary || "",
      signOnDate: signOnDate || undefined,
      contractDurationMonths:
        contractDurationMonths !== undefined && contractDurationMonths !== ""
          ? Number(contractDurationMonths)
          : undefined,
      remarks: remarks?.trim?.() || "",
      status: "Open",
    });

    const result = await Vacancy.findById(created._id).populate(POPULATE).lean();

    // Notify agency staff (best-effort; never block vacancy creation).
    try {
      const [signer, staff] = await Promise.all([
        User.findById(req.user?._id).select("name email phone userType").lean(),
        User.find({
          agencyId,
          role: { $in: ["AGENT", "AGENCY_ADMIN"] },
          status: { $ne: "inactive" },
        })
          .select("email")
          .lean(),
      ]);
      queueVacancyCreatedEmail({
        vacancy: {
          vacancyId,
          vesselOwnerName:
            owner.company_shortname || owner.company_name || "",
          vesselName: vesselDoc.vesselname,
          vesselType,
          flag,
          rank: rank.trim(),
          openings: openingsNum,
          salary: created.salary,
          signOnDate: created.signOnDate,
          contractDurationMonths: created.contractDurationMonths,
        },
        agency: updatedAgency,
        signer,
        recipientEmails: staff.map((u) => u.email),
      });
    } catch (mailErr) {
      console.error("[vacancy] notify failed:", mailErr.message || mailErr);
    }

    return result;
  } catch (error) {
    if (error?.code === 11000) {
      throw new AppError(400, "Duplicate vacancy id, please try again");
    }
    throw new AppError(500, "Error creating vacancy, please try again later");
  }
}

async function list(req) {
  const {
    page = 1,
    limit = 10,
    sortField = "createdAt",
    sortOrder = "desc",
    searchValue = "",
    status,
    all,
  } = req.query;

  const extraFilter = {};
  if (req.user?.role !== "SUPER_ADMIN" && req.user?.agencyId) {
    extraFilter.agencyId = req.user.agencyId;
  }
  if (status) extraFilter.status = status;

  if (all === "true") {
    const data = await Vacancy.find(extraFilter)
      .sort({ createdAt: -1 })
      .populate(POPULATE)
      .lean();
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
    Model: Vacancy,
    searchValue,
    searchFields: ["vacancyId", "rank", "vesselType", "flag"],
    page: pageNumber,
    pageSize: pageSizeNumber,
    sortField,
    sortOrder,
    extraFilter,
  });

  const { data, totalRecords } = await facetPaginate({
    Model: Vacancy,
    matchFilter: queryFilter,
    sort,
    skip,
    limit: pageSizeNumber,
    populate: POPULATE,
  });

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

async function getById(req) {
  const vacancy = await Vacancy.findOne(scopedQuery(req, { _id: req.params.id }))
    .populate(POPULATE)
    .lean();
  if (!vacancy) throw new AppError(404, "Vacancy not found");
  return vacancy;
}

async function statusCounts(req) {
  const { searchValue = "" } = req.query;
  const extraFilter = {};
  if (req.user?.role !== "SUPER_ADMIN" && req.user?.agencyId) {
    extraFilter.agencyId = req.user.agencyId;
  }
  const { queryFilter } = buildListQuery({
    Model: Vacancy,
    searchValue,
    searchFields: ["vacancyId", "rank", "vesselType", "flag"],
    page: 1,
    pageSize: 1,
    extraFilter,
  });
  return computeStatusCounts({
    Model: Vacancy,
    matchFilter: queryFilter,
    field: "status",
  });
}

async function updateById(req) {
  const { id } = req.params;
  const existing = await Vacancy.findOne(scopedQuery(req, { _id: id }));
  if (!existing) throw new AppError(404, "Vacancy not found");
  assertCanManage(req, existing);

  const data = {};
  const b = req.body || {};

  // If vessel/owner change, re-validate and refresh derived fields.
  if (b.vessel && String(b.vessel) !== String(existing.vessel)) {
    const vesselDoc = await loadVesselForAgency(b.vessel, existing.agencyId);
    const owner = b.vesselOwner || existing.vesselOwner;
    if (String(vesselDoc.vesselOwner) !== String(owner)) {
      throw new AppError(
        400,
        "Vessel does not belong to the selected vessel owner",
      );
    }
    data.vessel = b.vessel;
    data.vesselOwner = owner;
    data.vesselType = b.vesselType?.trim() || vesselDoc.vesseltype || "";
    data.flag = b.flag?.trim() || vesselDoc.flag || "";
  } else {
    if (b.vesselOwner) data.vesselOwner = b.vesselOwner;
    if (b.vesselType !== undefined) data.vesselType = b.vesselType?.trim() || "";
    if (b.flag !== undefined) data.flag = b.flag?.trim() || "";
  }

  if (b.rank !== undefined) {
    if (!b.rank?.trim()) throw new AppError(400, "Rank is required");
    data.rank = b.rank.trim();
  }
  if (b.openings !== undefined) {
    data.openings = Math.max(1, parseInt(b.openings, 10) || 1);
  }
  if (b.salary !== undefined) data.salary = b.salary?.trim?.() || b.salary || "";
  if (b.signOnDate !== undefined) data.signOnDate = b.signOnDate || null;
  if (b.contractDurationMonths !== undefined) {
    data.contractDurationMonths =
      b.contractDurationMonths === ""
        ? undefined
        : Number(b.contractDurationMonths);
  }
  if (b.remarks !== undefined) data.remarks = b.remarks?.trim?.() || "";
  if (b.status !== undefined) {
    if (!VACANCY_STATUSES.includes(b.status)) {
      throw new AppError(400, "Invalid vacancy status");
    }
    data.status = b.status;
  }

  // Track the most recent editor (replaces any previous editor).
  data.updatedBy = req.user?._id;
  data.lastEditedAt = new Date();

  const updated = await Vacancy.findByIdAndUpdate(id, data, { new: true })
    .populate(POPULATE)
    .lean();
  return updated;
}

async function closeById(req) {
  const existing = await Vacancy.findOne(scopedQuery(req, { _id: req.params.id }));
  if (!existing) throw new AppError(404, "Vacancy not found");
  assertCanManage(req, existing);

  existing.status = existing.status === "Closed" ? "Open" : "Closed";
  existing.updatedBy = req.user?._id;
  existing.lastEditedAt = new Date();
  await existing.save();
  return Vacancy.findById(existing._id).populate(POPULATE).lean();
}

module.exports = {
  create,
  list,
  statusCounts,
  getById,
  updateById,
  closeById,
  VACANCY_STATUSES,
};
