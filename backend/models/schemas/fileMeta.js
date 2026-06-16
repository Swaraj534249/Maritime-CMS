const { Schema } = require("mongoose");

/** Shared S3 file metadata subdocument (User, Feedback, etc.). */
const fileMetaSchema = new Schema(
  {
    filename: String,
    originalName: String,
    key: String,
    path: String,
    storage: { type: String, default: "s3" },
    mimetype: String,
    size: Number,
    uploadedAt: Date,
  },
  { _id: false },
);

module.exports = { fileMetaSchema };
