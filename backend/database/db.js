require("dotenv").config();
const mongoose = require("mongoose");

/**
 * Connect once before accepting traffic. Fails fast so the API does not run without MongoDB.
 */
exports.connectToDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not set");
  }
  await mongoose.connect(process.env.MONGO_URI);
  console.log("connected to DB");
};
