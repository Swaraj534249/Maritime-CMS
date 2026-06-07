const mongoose = require("mongoose");
const { Schema } = mongoose;

const VACANCY_STATUSES = [
  "Open",
  "Partially Filled",
  "Filled",
  "Closed",
];

const vacancySchema = new Schema(
  {
    agencyId: {
      type: Schema.Types.ObjectId,
      ref: "Agency",
      required: true,
      index: true,
    },
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    vacancyId: {
      type: String,
      required: true,
      trim: true,
    },
    sequenceNumber: {
      type: Number,
      required: true,
    },

    // Source
    vesselOwner: {
      type: Schema.Types.ObjectId,
      ref: "VesselOwner",
      required: true,
      index: true,
    },
    vessel: {
      type: Schema.Types.ObjectId,
      ref: "Vessel",
      required: true,
      index: true,
    },
    vesselType: {
      type: String,
      trim: true,
    },
    flag: {
      type: String,
      trim: true,
    },

    // Position
    rank: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    openings: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    filledCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Terms
    salary: {
      type: String,
      trim: true,
    },
    signOnDate: {
      type: Date,
    },
    contractDurationMonths: {
      type: Number,
      min: 0,
    },
    remarks: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: VACANCY_STATUSES,
      default: "Open",
      index: true,
    },
  },
  { timestamps: true, versionKey: false },
);

vacancySchema.index({ agencyId: 1, sequenceNumber: 1 }, { unique: true });
vacancySchema.index({ vacancyId: 1 }, { unique: true });

module.exports = mongoose.model("Vacancy", vacancySchema);
module.exports.VACANCY_STATUSES = VACANCY_STATUSES;
