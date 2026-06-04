const mongoose = require("mongoose");
const { Schema } = mongoose;
const { fileMetaSchema } = require("./schemas/fileMeta");
const { INDUSTRY_TYPES } = require("./schemas/industryTypes");

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: fileMetaSchema,
    phone: { type: String, trim: true },
    alternatePhone: { type: String, trim: true },
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ["Male", "Female", "Other", ""],
    },
    address: { type: String, trim: true },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", ""],
    },
    aadharNumber: { type: String, trim: true },
    panNumber: { type: String, trim: true },
    aadhar: fileMetaSchema,
    pan: fileMetaSchema,
    socialMedia: {
      linkedin: { type: String, trim: true },
      instagram: { type: String, trim: true },
      facebook: { type: String, trim: true },
    },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["SUPER_ADMIN", "AGENCY_ADMIN", "AGENT"],
      required: true,
      default: "AGENT",
    },
    agencyId: {
      type: Schema.Types.ObjectId,
      ref: "Agency",
      required: function () {
        return this.role === "AGENCY_ADMIN" || this.role === "AGENT";
      },
      index: true,
    },
    userType: {
      type: String,
      required: false,
    },
    industryType: {
      type: String,
      enum: INDUSTRY_TYPES,
      required: function () {
        return this.role === "AGENCY_ADMIN" || this.role === "AGENT";
      },
    },
    status: {
      type: String,
      enum: ["unverified", "verified", "active", "inactive"],
      default: "unverified",
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.index({ agencyId: 1, role: 1 });
userSchema.index({ agencyId: 1, status: 1 });
userSchema.index({ agencyId: 1, industryType: 1 });
userSchema.index({ industryType: 1, role: 1 });

userSchema.methods.belongsToAgency = function (agencyId) {
  return this.agencyId && this.agencyId.toString() === agencyId.toString();
};

userSchema.methods.hasRole = function (...roles) {
  return roles.includes(this.role);
};

userSchema.statics.findByAgency = function (agencyId, filter = {}) {
  return this.find({ agencyId, ...filter });
};

userSchema.statics.findByIndustry = function (industryType, filter = {}) {
  return this.find({ industryType, ...filter });
};

module.exports = mongoose.model("User", userSchema);
