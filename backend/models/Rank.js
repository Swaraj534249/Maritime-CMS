const mongoose = require("mongoose");
const { Schema } = mongoose;

const rankSchema = new Schema(
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
    rankName: {
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

rankSchema.index({ agencyId: 1, rankName: 1 }, { unique: true });

module.exports = mongoose.model("Rank", rankSchema);
