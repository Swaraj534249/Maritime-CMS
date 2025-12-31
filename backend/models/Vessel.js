const mongoose = require("mongoose");
const { Schema } = mongoose;

const vesselSchema = new Schema(
  {
    vesselOwner: {
      type: Schema.Types.ObjectId,
      ref: "VesselOwner",
      required: true,
      index: true,
    },
    vesselname: { type: String, required: true },
    vessel_category: { type: String, required: true },
    vesseltype: { type: String, required: true },
    imo_Number: { type: String, required: true },
    grt: { type: String },
    bhp: { type: String },
    bhp2: { type: String },
    flag: { type: String },
    vessel_image: {
      filename: String,
      path: String,
      mimetype: String,
      size: Number,
      uploadedAt: Date,
    },
    vessel_documents: {
      main: {
        filename: { type: String, required: false },
        originalName: { type: String, required: false },
        path: { type: String, required: false },
        mimetype: { type: String, required: false },
        size: { type: Number, required: false },
        uploadedAt: { type: Date },
      },
      old: {
        filename: { type: String, required: false },
        originalName: { type: String, required: false },
        path: { type: String, required: false },
        mimetype: { type: String, required: false },
        size: { type: Number, required: false },
        uploadedAt: { type: Date },
      },
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, versionKey: false },
);

module.exports = mongoose.model("Vessel", vesselSchema);
