const mongoose = require("mongoose");
const { Schema } = mongoose;

const agencySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    contactPerson: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      trim: true,
    },
    licenseNumber: {
      type: String,
      sparse: true, // allows multiple null values
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    subscriptionPlan: {
      type: String,
      enum: ["basic", "premium", "enterprise"],
      default: "basic",
    },
    subscriptionExpiresAt: {
      type: Date,
    },
    maxAgents: {
      type: Number,
      default: 5, // limit based on subscription
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

// Index for faster queries
agencySchema.index({ isActive: 1 });

// Virtual for active agents count (you'll populate this in queries)
agencySchema.virtual("agentsCount", {
  ref: "User",
  localField: "_id",
  foreignField: "agencyId",
  count: true,
});

module.exports = mongoose.model("Agency", agencySchema);