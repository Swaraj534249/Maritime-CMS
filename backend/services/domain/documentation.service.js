const Documentation = require("../../models/Documentation");
const Candidate = require("../../models/Candidate");
const { AppError } = require("../../errors/AppError");
const { buildListQuery } = require("../../utils/ListQueryBuilder");
const { buildListResponse } = require("../../utils/ListResponseBuilder");
const { facetPaginate } = require("../../utils/facetList");
const { computeStatusCounts } = require("../../utils/statusCounts");
const { buildVersionedPair } = require("../../utils/versionedDocument");
const { mapPresignedMeta } = require("./presignedMeta.helper");

const { DOCUMENT_TYPES } = Documentation;
const DOC_KEYS = DOCUMENT_TYPES.map((d) => d.key);
// Files that mirror back to the candidate's profile when re-uploaded.
const CANDIDATE_SYNCED = { passport: "passport", cdc: "cdc" };

// Full populate — used only for the single-record detail (verify) view.
const POPULATE = [
  {
    path: "candidate",
    select:
      "firstName middleName lastName rank email phone currentStatus indosNumber documents",
  },
  {
    path: "vacancy",
    select: "vacancyId rank vesselType vessel signOnDate",
    populate: { path: "vessel", select: "vesselname" },
  },
  { path: "assignedTo", select: "name userType" },
  { path: "addedBy", select: "name" },
  { path: "updatedBy", select: "name" },
];

// Light populate for the LIST: candidate/vacancy/vessel come from snapshot
// fields, so we only resolve the user names the table actually shows.
const LIST_POPULATE = [
  { path: "assignedTo", select: "name userType" },
  { path: "addedBy", select: "name" },
  { path: "updatedBy", select: "name" },
];

function scopedQuery(req, extra = {}) {
  const query = { ...extra };
  if (req.user?.role !== "SUPER_ADMIN" && req.user?.agencyId) {
    query.agencyId = req.user.agencyId;
  }
  return query;
}

async function list(req) {
  const {
    page = 1,
    limit = 10,
    sortField = "createdAt",
    sortOrder = "desc",
    searchValue = "",
    status,
    assignedTo,
  } = req.query;

  const extraFilter = {};
  if (req.user?.role !== "SUPER_ADMIN" && req.user?.agencyId) {
    extraFilter.agencyId = req.user.agencyId;
  }
  if (assignedTo) extraFilter.assignedTo = assignedTo;
  // status applied inside facetPaginate so folded counts see all statuses.

  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const pageSizeNumber = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

  const { queryFilter, skip, sort } = buildListQuery({
    Model: Documentation,
    searchValue,
    searchFields: ["candidateName", "vacancyCode", "rank"],
    page: pageNumber,
    pageSize: pageSizeNumber,
    sortField,
    sortOrder,
    extraFilter,
  });

  const { data, totalRecords, statusCounts } = await facetPaginate({
    Model: Documentation,
    matchFilter: queryFilter,
    sort,
    skip,
    limit: pageSizeNumber,
    populate: LIST_POPULATE,
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
  const { searchValue = "", assignedTo } = req.query;
  const extraFilter = {};
  if (req.user?.role !== "SUPER_ADMIN" && req.user?.agencyId) {
    extraFilter.agencyId = req.user.agencyId;
  }
  if (assignedTo) extraFilter.assignedTo = assignedTo;

  const { queryFilter } = buildListQuery({
    Model: Documentation,
    searchValue,
    searchFields: ["candidateName", "vacancyCode", "rank"],
    page: 1,
    pageSize: 1,
    extraFilter,
  });

  return computeStatusCounts({
    Model: Documentation,
    matchFilter: queryFilter,
    field: "status",
  });
}

async function getById(req) {
  const doc = await Documentation.findOne(
    scopedQuery(req, { _id: req.params.id }),
  )
    .populate(POPULATE)
    .lean();
  if (!doc) throw new AppError(404, "Documentation record not found");
  return doc;
}

/** Save + verify a single document on a documentation record. */
async function verifyDocument(req) {
  const { id } = req.params;
  const { docType } = req.body || {};

  const spec = DOCUMENT_TYPES.find((d) => d.key === docType);
  if (!spec) throw new AppError(400, "Invalid document type");

  const doc = await Documentation.findOne(scopedQuery(req, { _id: id }));
  if (!doc) throw new AppError(404, "Documentation record not found");

  // Only some documents (e.g. contract letter) have mandatory fields.
  if (spec.requiredFields) {
    for (const field of spec.fields) {
      const val = req.body[field];
      if (val === undefined || val === null || val === "") {
        throw new AppError(400, `${field} is required for ${spec.label}`);
      }
    }
  }

  if (!doc.documents) doc.documents = {};
  const entry = doc.documents[docType] || {};

  // Apply fields (empty -> undefined so optional dates don't fail casting).
  spec.fields.forEach((field) => {
    const val = req.body[field];
    entry[field] = val === "" || val === null ? undefined : val;
  });

  // PPE may be unavailable at this stage (issued on board). In that case a
  // reason is required and no file is needed.
  if (docType === "ppe") {
    const noPpe = !!req.body.noPpe;
    if (noPpe) {
      const reason = (req.body.noPpeReason || "").trim();
      if (!reason) {
        throw new AppError(400, "Please enter a reason for no PPE");
      }
      entry.noPpe = true;
      entry.noPpeReason = reason;
    } else {
      entry.noPpe = false;
      entry.noPpeReason = undefined;
    }
  }

  // Optional (re)uploaded file — versioned main/old.
  const fileMeta = req.body.file;
  let mappedMeta = null;
  if (fileMeta && (fileMeta.key || fileMeta.path)) {
    mappedMeta = mapPresignedMeta({
      ...fileMeta,
      key: fileMeta.key || fileMeta.path,
    });
    entry.file = buildVersionedPair(entry.file, mappedMeta);
  }

  entry.verified = true;
  entry.verifiedBy = req.user?._id;
  entry.verifiedAt = new Date();

  doc.documents[docType] = entry;
  doc.markModified("documents");

  // Passport/CDC: a re-uploaded file becomes the candidate's new main file.
  const candidateField = CANDIDATE_SYNCED[docType];
  if (candidateField && mappedMeta) {
    const candidate = await Candidate.findById(doc.candidate);
    if (candidate) {
      if (!candidate.documents) candidate.documents = {};
      candidate.documents[candidateField] = buildVersionedPair(
        candidate.documents[candidateField],
        mappedMeta,
      );
      candidate.markModified("documents");
      await candidate.save();
    }
  }

  // All documents verified → mark the record Verified.
  const allVerified = DOC_KEYS.every((k) => doc.documents?.[k]?.verified);
  if (allVerified && doc.status === "In Documentation") {
    doc.status = "Verified";
  }

  doc.updatedBy = req.user?._id;
  doc.lastEditedAt = new Date();
  await doc.save();

  return Documentation.findById(doc._id).populate(POPULATE).lean();
}

module.exports = { list, statusCounts, getById, verifyDocument };
