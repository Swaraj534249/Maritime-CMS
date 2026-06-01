/** True when a stored file reference has a path or filename. */
function hasStoredFile(file) {
  if (!file) return false;
  const path = file.path != null ? String(file.path).trim() : "";
  const filename = file.filename != null ? String(file.filename).trim() : "";
  return Boolean(path || filename);
}

/** Plain copy — avoids Mongoose subdocument reference bugs. */
function cloneFileMeta(file) {
  if (!hasStoredFile(file)) return null;
  const plain =
    file && typeof file.toObject === "function" ? file.toObject() : file;
  return {
    filename: plain.filename,
    originalName: plain.originalName,
    path: plain.path,
    storage: plain.storage || "s3",
    mimetype: plain.mimetype,
    size: plain.size,
    uploadedAt: plain.uploadedAt,
  };
}

/**
 * Build main/old pair for a versioned document upload.
 * - First upload: { main } only
 * - Re-upload: new → main, previous main → old
 */
function buildVersionedPair(existingDoc, newMainMeta) {
  const main = { ...newMainMeta };
  const previousMain = cloneFileMeta(existingDoc?.main);

  if (!previousMain) {
    return { main };
  }

  return { main, old: previousMain };
}

/** Normalize mongoose subdocument / plain object for reads. */
function toPlainDoc(doc) {
  if (!doc) return null;
  return typeof doc.toObject === "function" ? doc.toObject() : doc;
}

module.exports = {
  hasStoredFile,
  cloneFileMeta,
  buildVersionedPair,
  toPlainDoc,
};
