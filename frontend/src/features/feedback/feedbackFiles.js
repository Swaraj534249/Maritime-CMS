/** Normalize stored file metadata for API / document viewers. */
export function fileWithPath(file) {
  if (!file) return null;
  return {
    ...file,
    path: file.path || file.key,
    uploadedAt: file.uploadedAt || file.createdAt,
  };
}

export function normalizeAttachments(list = []) {
  return (list || []).map(fileWithPath).filter(Boolean);
}

/** All attachments across submission + thread updates. */
export function collectFeedbackAttachments(feedback) {
  if (!feedback) return [];

  const items = [];
  const seen = new Set();

  const push = (file, sectionLabel, uploadedAt) => {
    const normalized = fileWithPath(file);
    if (!normalized?.path || seen.has(normalized.path)) return;
    seen.add(normalized.path);
    items.push({
      ...normalized,
      sectionLabel,
      uploadedAt: uploadedAt || normalized.uploadedAt,
    });
  };

  normalizeAttachments(feedback.attachments).forEach((f) =>
    push(f, "Submission", feedback.createdAt),
  );

  if (feedback.attachment?.key) {
    push(feedback.attachment, "Submission", feedback.createdAt);
  }

  (feedback.updates || []).forEach((update) => {
    const label = `${formatStatusLabel(update.status)} — ${update.createdBy?.name || "Update"}`;
    normalizeAttachments(update.attachments).forEach((f) =>
      push(f, label, update.createdAt),
    );
  });

  return items;
}

export function formatStatusLabel(status) {
  const map = {
    open: "Open",
    in_progress: "In Progress",
    resolved: "Resolved",
    closed: "Closed",
    reopened: "Reopened",
    reminder: "Reminder",
  };
  return map[status] || status;
}

/** Build DocumentsDialog sections from feedback files. */
export function feedbackDocumentSections(feedback) {
  return collectFeedbackAttachments(feedback).map((file, index) => ({
    key: `feedback-file-${index}`,
    title: file.sectionLabel || "Attachment",
    icon: null,
    documents: {
      main: {
        ...file,
        uploadedAt: file.uploadedAt || feedback?.createdAt,
      },
    },
  }));
}

export function countFeedbackDocuments(feedback) {
  return collectFeedbackAttachments(feedback).length;
}
