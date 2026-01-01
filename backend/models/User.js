const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
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
  },
  password: {
    type: String,
    required: true,
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
  isAdmin: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("User", userSchema);
