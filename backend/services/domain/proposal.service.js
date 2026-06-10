const Proposal = require("../../models/Proposal");
const Vacancy = require("../../models/Vacancy");
const Candidate = require("../../models/Candidate");
const Agency = require("../../models/Agency");
const User = require("../../models/User");
const { AppError } = require("../../errors/AppError");
const {
  queueCandidateProposedEmail,
} = require("../email/proposalNotification.service");
const { buildListQuery } = require("../../utils/ListQueryBuilder");
const { buildListResponse } = require("../../utils/ListResponseBuilder");
const { facetPaginate } = require("../../utils/facetList");
const { computeStatusCounts } = require("../../utils/statusCounts");

const { ACTIVE_PROPOSAL_STATUSES } = Proposal;
const MAX_PROPOSALS_PER_VACANCY = 10;

function scopedQuery(req, extra = {}) {
  const query = { ...extra };
  if (req.user?.role !== "SUPER_ADMIN" && req.user?.agencyId) {
    query.agencyId = req.user.agencyId;
  }
  return query;
}

function agencyIdOf(req) {
  if (req.user?.role !== "SUPER_ADMIN" && req.user?.agencyId) {
    return req.user.agencyId;
  }
  return req.body?.agencyId || req.query?.agencyId || null;
}

function candidateFullName(c) {
  return [c.firstName, c.middleName, c.lastName].filter(Boolean).join(" ");
}

const POPULATE = [
  {
    path: "candidate",
    select:
      "firstName middleName lastName rank vesselType email phone currentStatus nationality gender dateOfBirth indosNumber cdcNumber passportNumber seamanBookNumber availableFrom",
  },
  {
    path: "vacancy",
    select:
      "vacancyId rank vesselType flag openings filledCount status vessel salary signOnDate contractDurationMonths",
    populate: { path: "vessel", select: "vesselname imo_Number" },
  },
];

async function loadVacancyForAgency(req, vacancyId) {
  if (!vacancyId) throw new AppError(400, "Vacancy is required");
  const vacancy = await Vacancy.findOne(scopedQuery(req, { _id: vacancyId }));
  if (!vacancy) throw new AppError(404, "Vacancy not found");
  return vacancy;
}

/** Candidates eligible to be proposed to a vacancy (rank match, not onboard,
 *  not already proposed here, not already selected anywhere). */
async function eligibleCandidates(req) {
  const vacancy = await loadVacancyForAgency(req, req.query.vacancyId);
  const agencyId = vacancy.agencyId;

  const [selectedCandidateIds, proposedHereIds, activeCount] =
    await Promise.all([
      Proposal.find({ agencyId, status: "Selected" }).distinct("candidate"),
      Proposal.find({ vacancy: vacancy._id }).distinct("candidate"),
      Proposal.countDocuments({
        vacancy: vacancy._id,
        status: { $in: ACTIVE_PROPOSAL_STATUSES },
      }),
    ]);

  const exclude = [...selectedCandidateIds, ...proposedHereIds];
  const remainingSlots = Math.max(0, MAX_PROPOSALS_PER_VACANCY - activeCount);

  const filter = {
    agencyId,
    isActive: true,
    rank: vacancy.rank,
    currentStatus: { $ne: "Onboard" },
    _id: { $nin: exclude },
  };

  const candidates = await Candidate.find(filter)
    .select("firstName middleName lastName rank vesselType currentStatus email phone")
    .sort({ firstName: 1 })
    .lean();

  return {
    vacancy: {
      _id: vacancy._id,
      vacancyId: vacancy.vacancyId,
      rank: vacancy.rank,
      vesselType: vacancy.vesselType,
      openings: vacancy.openings,
      filledCount: vacancy.filledCount,
    },
    maxProposals: MAX_PROPOSALS_PER_VACANCY,
    activeProposals: activeCount,
    remainingSlots,
    candidates: candidates.map((c) => ({ ...c, fullName: candidateFullName(c) })),
  };
}

async function propose(req) {
  const { vacancyId, candidateIds } = req.body;
  if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
    throw new AppError(400, "Select at least one candidate to propose");
  }

  const vacancy = await loadVacancyForAgency(req, vacancyId);
  if (["Filled", "Closed"].includes(vacancy.status)) {
    throw new AppError(400, `Vacancy is ${vacancy.status.toLowerCase()}`);
  }

  const activeCount = await Proposal.countDocuments({
    vacancy: vacancy._id,
    status: { $in: ACTIVE_PROPOSAL_STATUSES },
  });
  if (activeCount + candidateIds.length > MAX_PROPOSALS_PER_VACANCY) {
    throw new AppError(
      400,
      `A vacancy can have at most ${MAX_PROPOSALS_PER_VACANCY} active proposals (currently ${activeCount})`,
    );
  }

  // Validate candidates belong to the agency and aren't already selected.
  const candidates = await Candidate.find({
    _id: { $in: candidateIds },
    agencyId: vacancy.agencyId,
  })
    .select("firstName middleName lastName rank currentStatus email")
    .lean();

  if (candidates.length !== candidateIds.length) {
    throw new AppError(400, "Some candidates were not found in your agency");
  }

  const selectedElsewhere = await Proposal.find({
    agencyId: vacancy.agencyId,
    candidate: { $in: candidateIds },
    status: "Selected",
  }).distinct("candidate");
  const selectedSet = new Set(selectedElsewhere.map(String));

  const docs = candidates
    .filter((c) => !selectedSet.has(String(c._id)))
    .map((c) => ({
      agencyId: vacancy.agencyId,
      proposedBy: req.user?._id,
      vacancy: vacancy._id,
      candidate: c._id,
      vacancyCode: vacancy.vacancyId,
      candidateName: candidateFullName(c),
      rank: c.rank,
      status: "Proposed",
    }));

  if (docs.length === 0) {
    throw new AppError(400, "No eligible candidates to propose");
  }

  try {
    // ordered:false so duplicates (already proposed) are skipped gracefully.
    await Proposal.insertMany(docs, { ordered: false });
  } catch (error) {
    if (error?.code !== 11000 && !error?.writeErrors) {
      throw new AppError(500, "Error proposing candidates, please try again");
    }
  }

  // Notify each proposed candidate (best-effort; never block the response).
  try {
    const [signer, agency] = await Promise.all([
      User.findById(req.user?._id).select("name email phone userType").lean(),
      Agency.findById(vacancy.agencyId).lean(),
    ]);
    await vacancy.populate([
      { path: "vessel", select: "vesselname" },
      { path: "vesselOwner", select: "company_name company_shortname" },
    ]);
    const vacancyInfo = {
      vacancyId: vacancy.vacancyId,
      vesselOwnerName:
        vacancy.vesselOwner?.company_shortname ||
        vacancy.vesselOwner?.company_name ||
        "",
      vesselName: vacancy.vessel?.vesselname,
      vesselType: vacancy.vesselType,
      rank: vacancy.rank,
      salary: vacancy.salary,
      signOnDate: vacancy.signOnDate,
      contractDurationMonths: vacancy.contractDurationMonths,
    };
    const proposedIds = new Set(docs.map((d) => String(d.candidate)));
    candidates
      .filter((c) => proposedIds.has(String(c._id)) && c.email)
      .forEach((c) => {
        queueCandidateProposedEmail({
          candidate: { name: candidateFullName(c), email: c.email },
          vacancy: vacancyInfo,
          agency,
          signer,
        });
      });
  } catch (mailErr) {
    console.error("[proposal] notify failed:", mailErr.message || mailErr);
  }

  return { proposed: docs.length };
}

async function list(req) {
  const {
    page = 1,
    limit = 10,
    sortField = "createdAt",
    sortOrder = "desc",
    searchValue = "",
    vacancyId,
    status,
  } = req.query;

  const extraFilter = {};
  if (req.user?.role !== "SUPER_ADMIN" && req.user?.agencyId) {
    extraFilter.agencyId = req.user.agencyId;
  }
  if (vacancyId) extraFilter.vacancy = vacancyId;
  if (status) extraFilter.status = status;

  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const pageSizeNumber = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

  const { queryFilter, skip, sort } = buildListQuery({
    Model: Proposal,
    searchValue,
    searchFields: ["candidateName", "vacancyCode", "rank"],
    page: pageNumber,
    pageSize: pageSizeNumber,
    sortField,
    sortOrder,
    extraFilter,
  });

  const { data, totalRecords } = await facetPaginate({
    Model: Proposal,
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

async function statusCounts(req) {
  const { searchValue = "", vacancyId } = req.query;
  const extraFilter = {};
  if (req.user?.role !== "SUPER_ADMIN" && req.user?.agencyId) {
    extraFilter.agencyId = req.user.agencyId;
  }
  if (vacancyId) extraFilter.vacancy = vacancyId;

  const { queryFilter } = buildListQuery({
    Model: Proposal,
    searchValue,
    searchFields: ["candidateName", "vacancyCode", "rank"],
    page: 1,
    pageSize: 1,
    extraFilter,
  });

  return computeStatusCounts({
    Model: Proposal,
    matchFilter: queryFilter,
    field: "status",
  });
}

async function select(req) {
  const proposal = await Proposal.findOne(
    scopedQuery(req, { _id: req.params.id }),
  );
  if (!proposal) throw new AppError(404, "Proposal not found");
  if (proposal.status !== "Proposed") {
    throw new AppError(400, `Proposal is already ${proposal.status.toLowerCase()}`);
  }

  // Selection requires the full checklist to be completed first.
  const cl = proposal.selectionChecklist || {};
  if (!cl.shortlisted || !cl.verified || !cl.interviewDone) {
    throw new AppError(
      400,
      "Complete the selection checklist before selecting this candidate",
    );
  }

  const vacancy = await Vacancy.findById(proposal.vacancy);
  if (!vacancy) throw new AppError(404, "Vacancy not found");
  if (["Filled", "Closed"].includes(vacancy.status)) {
    throw new AppError(400, `Vacancy is ${vacancy.status.toLowerCase()}`);
  }

  // Mark this proposal selected.
  proposal.status = "Selected";
  proposal.decidedBy = req.user?._id;
  proposal.decidedAt = new Date();
  await proposal.save();

  // Update vacancy fill counts.
  vacancy.filledCount = (vacancy.filledCount || 0) + 1;
  if (vacancy.filledCount >= vacancy.openings) {
    vacancy.status = "Filled";
    // Auto-reject remaining open proposals on this vacancy.
    await Proposal.updateMany(
      { vacancy: vacancy._id, status: "Proposed" },
      { $set: { status: "Vacancy filled", decidedAt: new Date() } },
    );
  } else {
    vacancy.status = "Partially Filled";
  }
  await vacancy.save();

  // Auto-reject this candidate's other open proposals on OTHER vacancies.
  await Proposal.updateMany(
    {
      candidate: proposal.candidate,
      _id: { $ne: proposal._id },
      status: "Proposed",
    },
    { $set: { status: "Selected on different vacancy", decidedAt: new Date() } },
  );

  return Proposal.findById(proposal._id).populate(POPULATE).lean();
}

async function reject(req) {
  const proposal = await Proposal.findOne(
    scopedQuery(req, { _id: req.params.id }),
  );
  if (!proposal) throw new AppError(404, "Proposal not found");
  if (proposal.status !== "Proposed") {
    throw new AppError(400, `Proposal is already ${proposal.status.toLowerCase()}`);
  }

  proposal.status = "Rejected";
  proposal.decidedBy = req.user?._id;
  proposal.decidedAt = new Date();
  await proposal.save();

  return Proposal.findById(proposal._id).populate(POPULATE).lean();
}

async function updateChecklist(req) {
  const proposal = await Proposal.findOne(
    scopedQuery(req, { _id: req.params.id }),
  );
  if (!proposal) throw new AppError(404, "Proposal not found");
  if (proposal.status !== "Proposed") {
    throw new AppError(
      400,
      "Checklist can only be changed while the proposal is in progress",
    );
  }

  const b = req.body || {};
  const current = proposal.selectionChecklist || {};
  proposal.selectionChecklist = {
    shortlisted:
      b.shortlisted !== undefined ? !!b.shortlisted : !!current.shortlisted,
    verified: b.verified !== undefined ? !!b.verified : !!current.verified,
    interviewDone:
      b.interviewDone !== undefined
        ? !!b.interviewDone
        : !!current.interviewDone,
  };
  await proposal.save();

  return Proposal.findById(proposal._id).populate(POPULATE).lean();
}

module.exports = {
  eligibleCandidates,
  propose,
  list,
  statusCounts,
  select,
  updateChecklist,
  reject,
  MAX_PROPOSALS_PER_VACANCY,
};
