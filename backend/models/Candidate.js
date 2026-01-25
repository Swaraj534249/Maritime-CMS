const mongoose = require("mongoose");
const { Schema } = mongoose;

const candidateSchema = new Schema(
  {
    // Agency & Agent Information
    agencyId: {
      type: Schema.Types.ObjectId,
      ref: "Agency",
      required: true,
      index: true,
    },
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    industryType: {
      type: String,
      enum: ["maritime", "healthcare", "construction", "hospitality", "other"],
      required: true,
      default: "maritime",
      index: true,
    },

    // Basic Information
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    middleName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
    },
    alternatePhone: {
      type: String,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },
    nationality: {
      type: String,
      required: true,
      default: "Indian",
    },
    
    // Address Information
    address: {
      type: String,
      required: true,
    },

    // Government IDs
    aadharNumber: {
      type: String,
      trim: true,
    },
    panNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },

    // Maritime Identification
    indosNumber: {
      type: String,
      trim: true,
      index: true,
    },
    cdcNumber: {
      type: String,
      trim: true,
      index: true,
    },
    cdcIssueDate: {
      type: Date,
    },
    cdcExpiryDate: {
      type: Date,
    },
    passportNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    passportIssueDate: {
      type: Date,
    },
    passportExpiryDate: {
      type: Date,
    },
    passportPlaceOfIssue: {
      type: String,
    },
    seamanBookNumber: {
      type: String,
      trim: true,
    },

    // Professional Information
    rank: {
      type: String,
      required: true,
      index: true,
    },
    vesselType: {
      type: String,
    },
    signOffDate: {
      type: Date,
    },

    // Current Status
    currentStatus: {
      type: String,
      enum: ["Available", "Onboard", "On Leave", "In Pool", "Not Available"],
      required: true,
      default: "Available",
      index: true,
    },
    availableFrom: {
      type: Date,
    },

    // Documents
    documents: {
      photo: {
        filename: String,
        originalName: String,
        path: String,
        mimetype: String,
        size: Number,
        uploadedAt: Date,
      },
      passport: {
        main: {
          filename: String,
          originalName: String,
          path: String,
          mimetype: String,
          size: Number,
          uploadedAt: Date,
        },
        old: {
          filename: String,
          originalName: String,
          path: String,
          mimetype: String,
          size: Number,
          uploadedAt: Date,
        },
      },
      cdc: {
        main: {
          filename: String,
          originalName: String,
          path: String,
          mimetype: String,
          size: Number,
          uploadedAt: Date,
        },
        old: {
          filename: String,
          originalName: String,
          path: String,
          mimetype: String,
          size: Number,
          uploadedAt: Date,
        },
      },
      indos: {
        main: {
          filename: String,
          originalName: String,
          path: String,
          mimetype: String,
          size: Number,
          uploadedAt: Date,
        },
        old: {
          filename: String,
          originalName: String,
          path: String,
          mimetype: String,
          size: Number,
          uploadedAt: Date,
        },
      },
      visa: {
        main: {
          filename: String,
          originalName: String,
          path: String,
          mimetype: String,
          size: Number,
          uploadedAt: Date,
        },
        old: {
          filename: String,
          originalName: String,
          path: String,
          mimetype: String,
          size: Number,
          uploadedAt: Date,
        },
      },
      aadhar: {
        filename: String,
        originalName: String,
        path: String,
        mimetype: String,
        size: Number,
        uploadedAt: Date,
      },
      pan: {
        filename: String,
        originalName: String,
        path: String,
        mimetype: String,
        size: Number,
        uploadedAt: Date,
      },
      medicalCertificate: {
        main: {
          filename: String,
          originalName: String,
          path: String,
          mimetype: String,
          size: Number,
          uploadedAt: Date,
        },
        old: {
          filename: String,
          originalName: String,
          path: String,
          mimetype: String,
          size: Number,
          uploadedAt: Date,
        },
      },
      seamanBook: {
        main: {
          filename: String,
          originalName: String,
          path: String,
          mimetype: String,
          size: Number,
          uploadedAt: Date,
        },
        old: {
          filename: String,
          originalName: String,
          path: String,
          mimetype: String,
          size: Number,
          uploadedAt: Date,
        },
      },
      resume: {
        main: {
          filename: String,
          originalName: String,
          path: String,
          mimetype: String,
          size: Number,
          uploadedAt: Date,
        },
        old: {
          filename: String,
          originalName: String,
          path: String,
          mimetype: String,
          size: Number,
          uploadedAt: Date,
        },
      },
    },

    // Next of Kin - Simplified flat structure
    nextOfKinName: {
      type: String,
    },
    nextOfKinRelationship: {
      type: String,
    },
    nextOfKinPhone: {
      type: String,
    },
    nextOfKinAddress: {
      type: String,
    },
    
    remarks: {
      type: String,
    },

    // Status flags
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound Indexes
candidateSchema.index({ agencyId: 1, isActive: 1 });
candidateSchema.index({ agencyId: 1, currentStatus: 1 });
candidateSchema.index({ agencyId: 1, rank: 1 });
candidateSchema.index({ addedBy: 1, isActive: 1 });
candidateSchema.index({ industryType: 1, rank: 1 });

// Virtual for full name
candidateSchema.virtual("fullName").get(function () {
  return this.middleName
    ? `${this.firstName} ${this.middleName} ${this.lastName}`
    : `${this.firstName} ${this.lastName}`;
});

// Virtual for age
candidateSchema.virtual("age").get(function () {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Method to check if candidate belongs to an agency
candidateSchema.methods.belongsToAgency = function (agencyId) {
  return this.agencyId && this.agencyId.toString() === agencyId.toString();
};

// Static method to find candidates by agency
candidateSchema.statics.findByAgency = function (agencyId, filter = {}) {
  return this.find({ agencyId, ...filter });
};

// Static method to find available candidates
candidateSchema.statics.findAvailable = function (agencyId, rank = null) {
  const filter = {
    agencyId,
    currentStatus: "Available",
    isActive: true,
  };
  if (rank) filter.rank = rank;
  return this.find(filter);
};

module.exports = mongoose.model("Candidate", candidateSchema);