const { sendMail } = require("../../utils/Emails");
const { enqueueEmailJob } = require("./emailQueue.service");
const {
  feedbackSubmittedEmail,
  feedbackStatusUpdateEmail,
} = require("./templates/feedback.templates");
const { buildAgencySignature } = require("./templates/signature.templates");
const Agency = require("../../models/Agency");
const User = require("../../models/User");

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

/**
 * Build a full agency signature for a feedback email by loading the agency +
 * the person (submitter/updater) so phone/role/address/license are included.
 */
async function buildFeedbackSignature(feedback, person = {}) {
  let agency = null;
  let user = null;
  try {
    [agency, user] = await Promise.all([
      feedback.agencyId ? Agency.findById(feedback.agencyId).lean() : null,
      person?.userId
        ? User.findById(person.userId).select("name email phone userType").lean()
        : null,
    ]);
  } catch (err) {
    // fall back to whatever we already have on the feedback object
  }
  return buildAgencySignature({
    signerName: user?.name || person?.name,
    signerRole: user?.userType,
    signerPhone: user?.phone,
    signerEmail: user?.email || person?.email,
    agencyName: agency?.name || feedback.agencyName,
    agencyShortName: agency?.shortName || feedback.agencyShortName,
    agencyAddress: agency?.address,
    agencyPhone: agency?.phone,
    licenseNumber: agency?.licenseNumber,
    agencyEmail: agency?.email,
    replyTo: agency?.email || person?.email,
  });
}

function queueFeedbackSubmittedEmail(feedback, fileBuffers = []) {
  const attachmentNames = (feedback.attachments || []).map(
    (a) => a.originalName || a.filename,
  );
  const subject = `[${feedback.ticketId}] ${feedback.title}`;

  enqueueEmailJob(async () => {
    const signatureHtml = await buildFeedbackSignature(
      feedback,
      feedback.submittedBy,
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
      signatureHtml,
    });
    await sendMail(FEEDBACK_NOTIFY_EMAIL, subject, html, {
      replyTo: feedback.submittedBy.email,
      attachments: toMailAttachments(fileBuffers),
    });
  });
}

function queueFeedbackStatusEmail({
  feedback,
  update,
  status,
  intro,
  to,
  subjectSuffix,
  cc = [],
  fileBuffers = [],
}) {
  enqueueEmailJob(async () => {
    const signatureHtml = await buildFeedbackSignature(feedback, update.createdBy);
    const html = feedbackStatusUpdateEmail({
      ticketId: feedback.ticketId,
      title: feedback.title,
      status,
      note: update.note,
      updatedByName: update.createdBy.name,
      updatedByEmail: update.createdBy.email,
      agencyName: feedback.agencyName,
      attachmentNames: (update.attachments || []).map(
        (a) => a.originalName || a.filename,
      ),
      createdAt: update.createdAt,
      intro,
      signatureHtml,
    });
    await sendMail(to, `[${feedback.ticketId}] ${subjectSuffix}`, html, {
      cc,
      replyTo: update.createdBy.email,
      attachments: toMailAttachments(fileBuffers),
    });
  });
}

function queueFeedbackResolvedEmail({ feedback, update, fileBuffers = [], cc = [] }) {
  queueFeedbackStatusEmail({
    feedback,
    update,
    status: "Resolved",
    intro: "Your feedback has been marked as resolved. Please review and confirm.",
    to: feedback.submittedBy.email,
    subjectSuffix: "Resolved",
    cc,
    fileBuffers,
  });
}

function queueFeedbackReopenedEmail({ feedback, update, fileBuffers = [] }) {
  queueFeedbackStatusEmail({
    feedback,
    update,
    status: "Reopened",
    intro: "The submitter has reopened this feedback ticket.",
    to: FEEDBACK_NOTIFY_EMAIL,
    subjectSuffix: "Reopened",
    fileBuffers,
  });
}

function queueFeedbackReminderEmail({ feedback, update, fileBuffers = [], cc = [] }) {
  queueFeedbackStatusEmail({
    feedback,
    update,
    status: "Reminder",
    intro:
      "This is a reminder to review the resolved feedback and close or reopen the ticket.",
    to: feedback.submittedBy.email,
    subjectSuffix: "Reminder",
    cc,
    fileBuffers,
  });
}

module.exports = {
  queueFeedbackSubmittedEmail,
  queueFeedbackResolvedEmail,
  queueFeedbackReopenedEmail,
  queueFeedbackReminderEmail,
  FEEDBACK_NOTIFY_EMAIL,
  toMailAttachments,
};
