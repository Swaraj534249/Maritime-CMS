const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  avatar: {
    secureUrl: {
      type: String,
    },
    publicId: {
      type: String,
    },
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
  isVerified: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
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
userSchema.index({ agencyId: 1, isActive: 1 });

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

module.exports = mongoose.model("User", userSchema);
