/**
 * Capitalize the first letter of every word; collapse extra spaces.
 * The rest of each word is left as-is so abbreviations (AB, CDC) survive.
 * e.g. "test officer 2" -> "Test Officer 2"
 */
function toTitleCase(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

module.exports = { toTitleCase };
