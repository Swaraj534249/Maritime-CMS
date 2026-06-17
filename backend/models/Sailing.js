const mongoose = require("mongoose");
const { Schema } = mongoose;

const SAILING_STATUSES = ["Onboard", "Signed Off"];

/**
 * A "sailing" record. Intentionally denormalized: it snapshots the candidate +
 * vacancy fields used across sea-service, invoicing, and reporting so those
 * reads don't over-fetch/join. Light refs are kept for drill-down + documents.
 */
const sailingSchema = new Schema(
  {
    agencyId: {
      type: Schema.Types.ObjectId,
      ref: "Agency",
      required: true,
      index: true,
    },

    // Light refs for drill-down (documents are read from the documentation record).
    candidate: { type: Schema.Types.ObjectId, ref: "Candidate", index: true },
    vacancy: { type: Schema.Types.ObjectId, ref: "Vacancy", index: true },
    documentation: {
      type: Schema.Types.ObjectId,
      ref: "Documentation",
      required: true,
    },
    proposal: { type: Schema.Types.ObjectId, ref: "Proposal" },

    // Candidate snapshot
    candidateName: { type: String, trim: true },
    rank: { type: String, trim: true },
    indosNumber: { type: String, trim: true },
    passportNumber: { type: String, trim: true },
    cdcNumber: { type: String, trim: true },

    // Vacancy snapshot
    vacancyCode: { type: String, trim: true },
    vesselOwnerName: { type: String, trim: true },
    vesselName: { type: String, trim: true },
    vesselType: { type: String, trim: true },
    salary: { type: String, trim: true },
    contractDurationMonths: { type: Number },

    // Dates
    leavingDate: { type: Date },
    signOnDate: { type: Date },
    tentativeSignOffDate: { type: Date },
    actualSignOffDate: { type: Date },
    arrivalDate: { type: Date },

    status: {
      type: String,
      enum: SAILING_STATUSES,
      default: "Onboard",
      index: true,
    },

    addedBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    lastEditedAt: { type: Date },
  },
  { timestamps: true, versionKey: false },
);

sailingSchema.index({ documentation: 1 }, { unique: true });
sailingSchema.index({ agencyId: 1, status: 1 });

module.exports = mongoose.model("Sailing", sailingSchema);
module.exports.SAILING_STATUSES = SAILING_STATUSES;
