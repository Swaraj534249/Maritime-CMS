/**
 * Normalizes API / Redux rejectWithValue payloads to a user-facing string.
 */
function getErrorMessage(err, fallback = "Something went wrong") {
  if (!err) return fallback;
  if (typeof err === "string") return err;
  if (typeof err.message === "string" && err.message) return err.message;
  if (typeof err.error === "string" && err.error) return err.error;
  return fallback;
}

module.exports = { getErrorMessage };
