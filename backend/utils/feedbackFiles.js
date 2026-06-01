const fileMetaSchema = {
  filename: String,
  originalName: String,
  key: String,
  path: String,
  mimetype: String,
  size: Number,
  uploadedAt: Date,
};

function fileWithPath(file) {
  if (!file) return null;
  return {
    ...file,
    path: file.path || file.key,
    uploadedAt: file.uploadedAt || file.createdAt,
  };
}

function normalizeAttachments(list = []) {
  return (list || []).map(fileWithPath).filter(Boolean);
}

function normalizeFeedback(feedback) {
  if (!feedback) return feedback;
  const doc = feedback.toObject ? feedback.toObject() : { ...feedback };

  if (doc.attachment?.key && !(doc.attachments || []).length) {
    doc.attachments = [fileWithPath(doc.attachment)];
  }
  doc.attachments = normalizeAttachments(doc.attachments);

  if (!doc.updates?.length) {
    doc.updates = [
      {
        status: "open",
        note: doc.description,
        attachments: doc.attachments,
        createdBy: {
          userId: doc.submittedBy?.userId,
          name: doc.submittedBy?.name,
          email: doc.submittedBy?.email,
          role: "AGENT",
        },
        createdAt: doc.createdAt,
      },
    ];
  } else {
    doc.updates = doc.updates.map((u) => ({
      ...u,
      attachments: normalizeAttachments(u.attachments),
    }));
  }

  return doc;
}

function collectAllAttachments(feedback) {
  const normalized = normalizeFeedback(feedback);
  const items = [];
  const seen = new Set();

  const push = (file) => {
    const f = fileWithPath(file);
    if (!f?.path || seen.has(f.path)) return;
    seen.add(f.path);
    items.push(f);
  };

  normalizeAttachments(normalized.attachments).forEach(push);
  (normalized.updates || []).forEach((u) =>
    normalizeAttachments(u.attachments).forEach(push),
  );
  return items;
}

module.exports = {
  fileMetaSchema,
  fileWithPath,
  normalizeAttachments,
  normalizeFeedback,
  collectAllAttachments,
};
