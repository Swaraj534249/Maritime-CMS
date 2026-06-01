const { sendMail } = require("../../utils/Emails");
const { enqueueEmailJob } = require("./emailQueue.service");
const {
  feedbackSubmittedEmail,
  feedbackStatusUpdateEmail,
} = require("./templates/feedback.templates");

const FEEDBACK_NOTIFY_EMAIL =
  process.env.FEEDBACK_NOTIFY_EMAIL || "bombaydealz@gmail.com";

function toMailAttachments(files = []) {
  return files
    .filter((f) => f?.buffer?.length || f?.content?.length)
    .map((f) => ({
      filename: f.originalname || f.originalName || f.filename,
      content: f.buffer || f.content,
      contentType: f.mimetype || f.contentType,
    }));
}

function queueFeedbackSubmittedEmail(feedback, fileBuffers = []) {
  const attachmentNames = (feedback.attachments || []).map(
    (a) => a.originalName || a.filename,
  );
  const html = feedbackSubmittedEmail({
    ticketId: feedback.ticketId,
    category: feedback.category,
    title: feedback.title,
    description: feedback.description,
    submitterName: feedback.submittedBy.name,
    submitterEmail: feedback.submittedBy.email,
    agencyName: feedback.agencyName,
    agencyShortName: feedback.agencyShortName,
    attachmentNames,
    createdAt: feedback.createdAt,
  });

  const subject = `[${feedback.ticketId}] ${feedback.title}`;

  enqueueEmailJob(() =>
    sendMail(FEEDBACK_NOTIFY_EMAIL, subject, html, {
      replyTo: feedback.submittedBy.email,
      attachments: toMailAttachments(fileBuffers),
    }),
  );
}

function queueFeedbackResolvedEmail({ feedback, update, fileBuffers = [], cc = [] }) {
  const html = feedbackStatusUpdateEmail({
    ticketId: feedback.ticketId,
    title: feedback.title,
    status: "Resolved",
    note: update.note,
    updatedByName: update.createdBy.name,
    updatedByEmail: update.createdBy.email,
    agencyName: feedback.agencyName,
    attachmentNames: (update.attachments || []).map(
      (a) => a.originalName || a.filename,
    ),
    createdAt: update.createdAt,
    intro: "Your feedback has been marked as resolved. Please review and confirm.",
  });

  enqueueEmailJob(() =>
    sendMail(feedback.submittedBy.email, `[${feedback.ticketId}] Resolved`, html, {
      cc,
      attachments: toMailAttachments(fileBuffers),
    }),
  );
}

function queueFeedbackReopenedEmail({ feedback, update, fileBuffers = [] }) {
  const html = feedbackStatusUpdateEmail({
    ticketId: feedback.ticketId,
    title: feedback.title,
    status: "Reopened",
    note: update.note,
    updatedByName: update.createdBy.name,
    updatedByEmail: update.createdBy.email,
    agencyName: feedback.agencyName,
    attachmentNames: (update.attachments || []).map(
      (a) => a.originalName || a.filename,
    ),
    createdAt: update.createdAt,
    intro: "The submitter has reopened this feedback ticket.",
  });

  enqueueEmailJob(() =>
    sendMail(
      FEEDBACK_NOTIFY_EMAIL,
      `[${feedback.ticketId}] Reopened`,
      html,
      {
        replyTo: update.createdBy.email,
        attachments: toMailAttachments(fileBuffers),
      },
    ),
  );
}

function queueFeedbackReminderEmail({ feedback, update, fileBuffers = [], cc = [] }) {
  const html = feedbackStatusUpdateEmail({
    ticketId: feedback.ticketId,
    title: feedback.title,
    status: "Reminder",
    note: update.note,
    updatedByName: update.createdBy.name,
    updatedByEmail: update.createdBy.email,
    agencyName: feedback.agencyName,
    attachmentNames: (update.attachments || []).map(
      (a) => a.originalName || a.filename,
    ),
    createdAt: update.createdAt,
    intro:
      "This is a reminder to review the resolved feedback and close or reopen the ticket.",
  });

  enqueueEmailJob(() =>
    sendMail(feedback.submittedBy.email, `[${feedback.ticketId}] Reminder`, html, {
      cc,
      attachments: toMailAttachments(fileBuffers),
    }),
  );
}

module.exports = {
  queueFeedbackSubmittedEmail,
  queueFeedbackResolvedEmail,
  queueFeedbackReopenedEmail,
  queueFeedbackReminderEmail,
  FEEDBACK_NOTIFY_EMAIL,
  toMailAttachments,
};
