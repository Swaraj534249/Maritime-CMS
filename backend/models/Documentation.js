const mongoose = require("mongoose");
const { Schema } = mongoose;
const { fileMetaSchema } = require("./schemas/fileMeta");

const DOCUMENTATION_STATUSES = [
  "In Documentation",
  "Verified",
  "Contract Finalized",
];

// Document types that must be verified before sign-on, with their fields.
const DOCUMENT_TYPES = [
  { key: "passport", label: "Passport", fields: ["issueDate", "expiryDate"] },
  { key: "cdc", label: "CDC", fields: ["issueDate", "expiryDate"] },
  { key: "ppe", label: "PPE", fields: ["receivedDate", "receivedBy"] },
  {
    key: "medical",
    label: "Medical Certificate",
    fields: ["issueDate", "expiryDate", "doctorName"],
  },
  {
    key: "contractLetter",
    label: "Contract Letter",
    fields: ["leavingDate", "signOnDate"],
    // Only the contract letter's fields are mandatory to verify.
    requiredFields: true,
  },
];

// Common per-document verification fields. Versioned file (main/old).
const versionedFile = { main: fileMetaSchema, old: fileMetaSchema };
const docBase = {
  verified: { type: Boolean, default: false },
  verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
  verifiedAt: { type: Date },
  file: versionedFile,
};

const documentsSchema = new Schema(
  {
    passport: {
      ...docBase,
      issueDate: Date,
      expiryDate: Date,
    },
    cdc: {
      ...docBase,
      issueDate: Date,
      expiryDate: Date,
    },
    ppe: {
      ...docBase,
      receivedDate: Date,
      receivedBy: { type: String, trim: true },
      // When PPE isn't available yet (e.g. issued on board), capture why
      // instead of forcing a file upload.
      noPpe: { type: Boolean, default: false },
      noPpeReason: { type: String, trim: true },
    },
    medical: {
      ...docBase,
      issueDate: Date,
      expiryDate: Date,
      doctorName: { type: String, trim: true },
    },
    contractLetter: {
      ...docBase,
      leavingDate: Date,
      signOnDate: Date,
    },
  },
  { _id: false },
);

const documentationSchema = new Schema(
  {
    agencyId: {
      type: Schema.Types.ObjectId,
      ref: "Agency",
      required: true,
      index: true,
    },

    // Links back to how the candidate got here.
    candidate: {
      type: Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
      index: true,
    },
    vacancy: {
      type: Schema.Types.ObjectId,
      ref: "Vacancy",
      required: true,
      index: true,
    },
    proposal: {
      type: Schema.Types.ObjectId,
      ref: "Proposal",
      required: true,
    },

    // Denormalized for fast display / search (avoids populating refs on lists).
    candidateName: { type: String, trim: true },
    indosNumber: { type: String, trim: true },
    vacancyCode: { type: String, trim: true },
    vesselName: { type: String, trim: true },
    rank: { type: String, trim: true },

    // Assignment
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    assignedAt: { type: Date },

    documents: { type: documentsSchema, default: () => ({}) },

    status: {
      type: String,
      enum: DOCUMENTATION_STATUSES,
      default: "In Documentation",
      index: true,
    },

    addedBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    lastEditedAt: { type: Date },
  },
  { timestamps: true, versionKey: false },
);

// One documentation record per proposal.
documentationSchema.index({ proposal: 1 }, { unique: true });
documentationSchema.index({ agencyId: 1, status: 1 });

module.exports = mongoose.model("Documentation", documentationSchema);
module.exports.DOCUMENTATION_STATUSES = DOCUMENTATION_STATUSES;
module.exports.DOCUMENT_TYPES = DOCUMENT_TYPES;
