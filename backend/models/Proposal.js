const mongoose = require("mongoose");
const { Schema } = mongoose;

const PROPOSAL_STATUSES = [
  "Proposed",
  "Selected",
  "Rejected",
  "Selected on different vacancy",
  "Vacancy filled",
];

// Statuses that count as an active/live proposal (toward the per-vacancy cap
// and toward eligibility exclusions).
const ACTIVE_PROPOSAL_STATUSES = ["Proposed", "Selected"];

const proposalSchema = new Schema(
  {
    agencyId: {
      type: Schema.Types.ObjectId,
      ref: "Agency",
      required: true,
      index: true,
    },
    proposedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    vacancy: {
      type: Schema.Types.ObjectId,
      ref: "Vacancy",
      required: true,
      index: true,
    },
    candidate: {
      type: Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
      index: true,
    },

    // Denormalized for fast display / search (avoids populating refs on lists).
    vacancyCode: { type: String, trim: true },
    vesselName: { type: String, trim: true },
    candidateName: { type: String, trim: true },
    indosNumber: { type: String, trim: true },
    rank: { type: String, trim: true },

    // Lightweight selection checklist completed before a candidate is selected.
    selectionChecklist: {
      shortlisted: { type: Boolean, default: false },
      verified: { type: Boolean, default: false },
      interviewDone: { type: Boolean, default: false },
    },

    status: {
      type: String,
      enum: PROPOSAL_STATUSES,
      default: "Proposed",
      index: true,
    },
    decidedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    decidedAt: { type: Date },
  },
  { timestamps: true, versionKey: false },
);

// One proposal per candidate per vacancy.
proposalSchema.index({ vacancy: 1, candidate: 1 }, { unique: true });
proposalSchema.index({ agencyId: 1, status: 1 });

module.exports = mongoose.model("Proposal", proposalSchema);
module.exports.PROPOSAL_STATUSES = PROPOSAL_STATUSES;
module.exports.ACTIVE_PROPOSAL_STATUSES = ACTIVE_PROPOSAL_STATUSES;
