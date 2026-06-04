const mongoose = require("mongoose");

/**
 * Connect once before accepting traffic. Fails fast so the API does not run without MongoDB.
 * Env is loaded in index.js before this module runs.
 */
exports.connectToDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not set");
  }
  await mongoose.connect(process.env.MONGO_URI);
  console.log("connected to DB");
};
