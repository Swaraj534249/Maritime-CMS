const Sailing = require("../../models/Sailing");
const Documentation = require("../../models/Documentation");
const Candidate = require("../../models/Candidate");
const { AppError } = require("../../errors/AppError");
const { buildListQuery } = require("../../utils/ListQueryBuilder");
const { buildListResponse } = require("../../utils/ListResponseBuilder");
const { facetPaginate } = require("../../utils/facetList");
const { computeStatusCounts } = require("../../utils/statusCounts");
const { queueSailingEmails } = require("../email/sailingNotification.service");

const { DOCUMENT_TYPES } = Documentation;
const DOC_KEYS = DOCUMENT_TYPES.map((d) => d.key);

function scopedQuery(req, extra = {}) {
  const query = { ...extra };
  if (req.user?.role !== "SUPER_ADMIN" && req.user?.agencyId) {
    query.agencyId = req.user.agencyId;
  }
  return query;
}

function fullName(c = {}) {
  return [c.firstName, c.middleName, c.lastName].filter(Boolean).join(" ");
}

function addMonths(date, months) {
  if (!date || !months) return undefined;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return undefined;
  d.setMonth(d.getMonth() + Number(months));
  return d;
}

/** Finalize a documentation record into a sailing (sign the candidate on). */
async function finalize(req) {
  const documentationId = req.body?.documentationId || req.params?.id;

  const doc = await Documentation.findOne(
    scopedQuery(req, { _id: documentationId }),
  )
    .populate({
      path: "candidate",
      select:
        "firstName middleName lastName rank indosNumber passportNumber cdcNumber email",
    })
    .populate({
      path: "vacancy",
      select:
        "vacancyId rank vesselType salary contractDurationMonths signOnDate vessel vesselOwner",
      populate: [
        { path: "vessel", select: "vesselname" },
        { path: "vesselOwner", select: "company_name company_shortname" },
      ],
    });

  if (!doc) throw new AppError(404, "Documentation record not found");

  const allVerified = DOC_KEYS.every((k) => doc.documents?.[k]?.verified);
  if (!allVerified) {
    throw new AppError(400, "Verify all documents before sign-on");
  }

  const existing = await Sailing.findOne({ documentation: doc._id }).select("_id");
  if (existing) throw new AppError(400, "This candidate is already signed on");

  const candidate = doc.candidate || {};
  const vacancy = doc.vacancy || {};
  const contract = doc.documents?.contractLetter || {};

  const signOnDate = contract.signOnDate || vacancy.signOnDate || null;
  const tentativeSignOffDate = addMonths(
    signOnDate,
    vacancy.contractDurationMonths,
  );

  const sailing = await Sailing.create({
    agencyId: doc.agencyId,
    candidate: candidate._id,
    vacancy: vacancy._id,
    documentation: doc._id,
    proposal: doc.proposal,

    candidateName: doc.candidateName || fullName(candidate),
    rank: doc.rank || candidate.rank,
    indosNumber: candidate.indosNumber || doc.indosNumber || "",
    passportNumber: candidate.passportNumber,
    cdcNumber: candidate.cdcNumber,

    vacancyCode: doc.vacancyCode || vacancy.vacancyId,
    vesselOwnerName:
      vacancy.vesselOwner?.company_shortname ||
      vacancy.vesselOwner?.company_name ||
      "",
    vesselName: vacancy.vessel?.vesselname || doc.vesselName || "",
    vesselType: vacancy.vesselType,
    salary: vacancy.salary,
    contractDurationMonths: vacancy.contractDurationMonths,

    leavingDate: contract.leavingDate || null,
    signOnDate,
    tentativeSignOffDate,

    status: "Onboard",
    addedBy: req.user?._id,
  });

  // Advance documentation + candidate status.
  doc.status = "Contract Finalized";
  doc.updatedBy = req.user?._id;
  doc.lastEditedAt = new Date();
  await doc.save();

  if (candidate._id) {
    await Candidate.findByIdAndUpdate(candidate._id, {
      currentStatus: "Onboard",
    });
  }

  // Notify candidate + agency staff (best-effort).
  try {
    queueSailingEmails({
      sailing: sailing.toObject(),
      candidateEmail: candidate.email,
    });
  } catch (mailErr) {
    console.error("[sailing] notify failed:", mailErr.message || mailErr);
  }

  return sailing.toObject();
}

async function list(req) {
  const {
    page = 1,
    limit = 10,
    sortField = "createdAt",
    sortOrder = "desc",
    searchValue = "",
    status,
  } = req.query;

  const extraFilter = {};
  if (req.user?.role !== "SUPER_ADMIN" && req.user?.agencyId) {
    extraFilter.agencyId = req.user.agencyId;
  }
  // status applied inside facetPaginate so folded counts see all statuses.

  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const pageSizeNumber = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

  const { queryFilter, skip, sort } = buildListQuery({
    Model: Sailing,
    searchValue,
    searchFields: ["candidateName", "vacancyCode", "rank", "vesselName"],
    page: pageNumber,
    pageSize: pageSizeNumber,
    sortField,
    sortOrder,
    extraFilter,
  });

  const { data, totalRecords, statusCounts } = await facetPaginate({
    Model: Sailing,
    matchFilter: queryFilter,
    sort,
    skip,
    limit: pageSizeNumber,
    populate: [{ path: "addedBy", select: "name" }],
    statusField: "status",
    statusValue: status,
    withCounts: true,
  });

  return buildListResponse({
    data,
    page: pageNumber,
    pageSize: pageSizeNumber,
    totalRecords,
    searchValue,
    sortField,
    sortOrder,
    aggregates: { statusCounts },
  });
}

async function statusCounts(req) {
  const { searchValue = "" } = req.query;
  const extraFilter = {};
  if (req.user?.role !== "SUPER_ADMIN" && req.user?.agencyId) {
    extraFilter.agencyId = req.user.agencyId;
  }
  const { queryFilter } = buildListQuery({
    Model: Sailing,
    searchValue,
    searchFields: ["candidateName", "vacancyCode", "rank", "vesselName"],
    page: 1,
    pageSize: 1,
    extraFilter,
  });
  return computeStatusCounts({
    Model: Sailing,
    matchFilter: queryFilter,
    field: "status",
  });
}

/** Record the actual sign-off + arrival dates and mark the sailing complete. */
async function signOff(req) {
  const { id } = req.params;
  const { actualSignOffDate, arrivalDate } = req.body || {};

  if (!actualSignOffDate) {
    throw new AppError(400, "Sign-off date is required");
  }

  const sailing = await Sailing.findOne(scopedQuery(req, { _id: id }));
  if (!sailing) throw new AppError(404, "Sailing record not found");

  sailing.actualSignOffDate = actualSignOffDate;
  sailing.arrivalDate = arrivalDate || undefined;
  sailing.status = "Signed Off";
  sailing.updatedBy = req.user?._id;
  sailing.lastEditedAt = new Date();
  await sailing.save();

  // Candidate is back and available for new vacancies.
  if (sailing.candidate) {
    await Candidate.findByIdAndUpdate(sailing.candidate, {
      currentStatus: "Available",
    });
  }

  return sailing.toObject();
}

module.exports = { finalize, list, statusCounts, signOff };
