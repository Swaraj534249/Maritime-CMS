const crypto = require("crypto");
const bcrypt = require("bcryptjs");

/** Random hash — user must use email setup link before login works. */
async function hashPlaceholderPassword() {
  return bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);
}

module.exports = { hashPlaceholderPassword };
