const Proposal = require("../../models/Proposal");
const Vacancy = require("../../models/Vacancy");
const Candidate = require("../../models/Candidate");
const Agency = require("../../models/Agency");
const User = require("../../models/User");
const Documentation = require("../../models/Documentation");
const { AppError } = require("../../errors/AppError");
const {
  queueCandidateProposedEmail,
  queueCandidateSelectedEmail,
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

// Full populate — used only for the single-record review (detail) view.
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

  const [proposedHereIds, activeCount] = await Promise.all([
    Proposal.find({ vacancy: vacancy._id }).distinct("candidate"),
    Proposal.countDocuments({
      vacancy: vacancy._id,
      status: { $in: ACTIVE_PROPOSAL_STATUSES },
    }),
  ]);

  const remainingSlots = Math.max(0, MAX_PROPOSALS_PER_VACANCY - activeCount);

  // Only "Available" candidates are proposable. Once selected anywhere a
  // candidate becomes "In Process" and drops out of every vacancy's list.
  const filter = {
    agencyId,
    isActive: true,
    rank: vacancy.rank,
    currentStatus: "Available",
    _id: { $nin: proposedHereIds },
  };

  const candidates = await Candidate.find(filter)
    .select(
      "firstName middleName lastName rank vesselType currentStatus email phone nationality dateOfBirth indosNumber cdcNumber availableFrom",
    )
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
    .select("firstName middleName lastName rank currentStatus email indosNumber")
    .lean();

  if (candidates.length !== candidateIds.length) {
    throw new AppError(400, "Some candidates were not found in your agency");
  }

  // Vessel name is snapshotted so the Proposed list needn't populate the vacancy.
  await vacancy.populate({ path: "vessel", select: "vesselname" });
  const vesselName = vacancy.vessel?.vesselname || "";

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
      vesselName,
      candidateName: candidateFullName(c),
      indosNumber: c.indosNumber || "",
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
  // status applied inside facetPaginate so folded counts see all statuses.

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

  // No populate: the table renders entirely from snapshot fields. Full
  // candidate/vacancy details are fetched by id when the review dialog opens.
  const { data, totalRecords, statusCounts } = await facetPaginate({
    Model: Proposal,
    matchFilter: queryFilter,
    sort,
    skip,
    limit: pageSizeNumber,
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

async function getById(req) {
  const proposal = await Proposal.findOne(scopedQuery(req, { _id: req.params.id }))
    .populate(POPULATE)
    .lean();
  if (!proposal) throw new AppError(404, "Proposal not found");
  return proposal;
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

  // Selecting a candidate must hand them off to a documentation agent.
  const documentationAgentId = req.body?.documentationAgentId;
  if (!documentationAgentId) {
    throw new AppError(400, "Please assign a documentation agent");
  }
  const docAgent = await User.findOne({
    _id: documentationAgentId,
    agencyId: vacancy.agencyId,
  }).select("_id");
  if (!docAgent) {
    throw new AppError(400, "Assigned agent not found in your agency");
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

  // Candidate moves to "In Process" so they leave every vacancy's propose list.
  await Candidate.findByIdAndUpdate(proposal.candidate, {
    currentStatus: "In Process",
  });

  // Resolve the few snapshot fields the Documentation list needs (so it can
  // render without populating candidate/vacancy/vessel).
  const [candidate] = await Promise.all([
    Candidate.findById(proposal.candidate).select("email indosNumber").lean(),
    vacancy.populate([
      { path: "vessel", select: "vesselname" },
      { path: "vesselOwner", select: "company_name company_shortname" },
    ]),
  ]);
  const vesselName = vacancy.vessel?.vesselname || "";

  // Hand off to documentation: create the Documentation work item.
  try {
    await Documentation.create({
      agencyId: vacancy.agencyId,
      candidate: proposal.candidate,
      vacancy: vacancy._id,
      proposal: proposal._id,
      candidateName: proposal.candidateName,
      indosNumber: candidate?.indosNumber || "",
      vacancyCode: proposal.vacancyCode || vacancy.vacancyId,
      vesselName,
      rank: proposal.rank,
      assignedTo: documentationAgentId,
      assignedBy: req.user?._id,
      assignedAt: new Date(),
      addedBy: req.user?._id,
      status: "In Documentation",
    });
  } catch (err) {
    if (err?.code !== 11000) {
      throw new AppError(500, "Selected, but failed to create documentation record");
    }
  }

  // Congratulate the candidate (best-effort; never block selection).
  try {
    const [signer, agency] = await Promise.all([
      User.findById(req.user?._id).select("name email phone userType").lean(),
      Agency.findById(vacancy.agencyId).lean(),
    ]);
    if (candidate?.email) {
      queueCandidateSelectedEmail({
        candidate: { name: proposal.candidateName, email: candidate.email },
        vacancy: {
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
        },
        agency,
        signer,
      });
    }
  } catch (mailErr) {
    console.error("[proposal] selected notify failed:", mailErr.message || mailErr);
  }

  return Proposal.findById(proposal._id).populate(POPULATE).lean();
}

async function assignableAgents(req) {
  const filter = {
    role: { $in: ["AGENT", "AGENCY_ADMIN"] },
    status: { $ne: "inactive" },
  };
  if (req.user?.role !== "SUPER_ADMIN" && req.user?.agencyId) {
    filter.agencyId = req.user.agencyId;
  }
  return User.find(filter).select("name userType").sort({ name: 1 }).lean();
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
  getById,
  statusCounts,
  assignableAgents,
  select,
  updateChecklist,
  reject,
  MAX_PROPOSALS_PER_VACANCY,
};
