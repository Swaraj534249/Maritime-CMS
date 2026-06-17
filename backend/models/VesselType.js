const mongoose = require("mongoose");
const { Schema } = mongoose;

const vesselTypeSchema = new Schema(
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
    typeName: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true, versionKey: false },
);

vesselTypeSchema.index({ agencyId: 1, typeName: 1 }, { unique: true });

module.exports = mongoose.model("VesselType", vesselTypeSchema);
