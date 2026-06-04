const mongoose = require("mongoose");
const { Schema } = mongoose;
const { fileMetaSchema } = require("./schemas/fileMeta");

const updateEntrySchema = new Schema(
  {
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed", "reopened", "reminder"],
      required: true,
    },
    note: { type: String, trim: true, maxlength: 2000 },
    attachments: [fileMetaSchema],
    createdBy: {
      userId: { type: Schema.Types.ObjectId, ref: "User" },
      name: String,
      email: String,
      role: String,
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const feedbackSchema = new Schema(
  {
    ticketId: {
      type: String,
      required: true,
      trim: true,
    },
    agencyId: {
      type: Schema.Types.ObjectId,
      ref: "Agency",
      required: true,
      index: true,
    },
    agencyName: { type: String, trim: true },
    agencyShortName: { type: String, trim: true },
    category: {
      type: String,
      required: true,
      enum: ["General Feedback / Suggestion", "Bug / Technical Issue"],
    },
    title: { type: String, required: true, trim: true, maxlength: 250 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    /** Initial submission attachments (also mirrored in updates[0]). */
    attachments: [fileMetaSchema],
    /** Legacy single attachment — normalized at read time. */
    attachment: fileMetaSchema,
    submittedBy: {
      userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
      name: { type: String, required: true },
      email: { type: String, required: true },
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed", "reopened"],
      default: "open",
      index: true,
    },
    sequenceNumber: { type: Number, required: true },
    updates: [updateEntrySchema],
  },
  { timestamps: true },
);

feedbackSchema.index({ agencyId: 1, sequenceNumber: 1 }, { unique: true });
feedbackSchema.index({ ticketId: 1 }, { unique: true });

module.exports = mongoose.model("Feedback", feedbackSchema);
