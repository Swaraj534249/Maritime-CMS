const mongoose = require("mongoose");
const { Schema } = mongoose;

const fileMetaSchema = new Schema(
  {
    filename: String,
    originalName: String,
    path: String,
    storage: { type: String, default: "s3" },
    mimetype: String,
    size: Number,
    uploadedAt: Date,
  },
  { _id: false },
);

const userSchema = new Schema({
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
    enum: [
      "A+",
      "A-",
      "B+",
      "B-",
      "AB+",
      "AB-",
      "O+",
      "O-",
      "",
    ],
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
    // enum:['Crew','Crewing Agent','Vessel Owner','Vessel Manager'],
    required: false,
  },
  // NEW: Industry type (inherited from agency)
  industryType: {
    type: String,
    enum: ["maritime", "healthcare", "construction", "hospitality", "other"],
    required: function () {
      return this.role === "AGENCY_ADMIN" || this.role === "AGENT";
    },
    index: true,
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
  //   required: function () {
  //   return this.role === "AGENCY_ADMIN" || this.role === "AGENT";
  // },
  },
  lastLoginAt: {
    type: Date,
  },
},
{
  timestamps: true,
}
);

userSchema.index({ agencyId: 1, role: 1 });
userSchema.index({ agencyId: 1, status: 1 });
userSchema.index({ agencyId: 1, industryType: 1 });
userSchema.index({ industryType: 1, role: 1 });

// Method to check if user belongs to an agency
userSchema.methods.belongsToAgency = function (agencyId) {
return this.agencyId && this.agencyId.toString() === agencyId.toString();
};

// Method to check if user has specific role
userSchema.methods.hasRole = function (...roles) {
return roles.includes(this.role);
};

// Static method to find users by agency
userSchema.statics.findByAgency = function (agencyId, filter = {}) {
return this.find({ agencyId, ...filter });
};

userSchema.statics.findByIndustry = function (industryType, filter = {}) {
  return this.find({ industryType, ...filter });
};

module.exports = mongoose.model("User", userSchema);
