function formatWhen(date) {
  return new Date(date || Date.now()).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
  });
}

function feedbackSubmittedEmail({
  ticketId,
  category,
  title,
  description,
  submitterName,
  submitterEmail,
  agencyName,
  agencyShortName,
  attachmentNames = [],
  createdAt,
}) {
  const agencyLabel = agencyShortName
    ? `${agencyName} (${agencyShortName})`
    : agencyName;
  const attachmentRow =
    attachmentNames.length > 0
      ? `<tr><td style="padding: 6px 12px 6px 0; font-weight: bold;">Attachments</td><td>${attachmentNames.join("<br/>")}</td></tr>`
      : "";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.5; color: #222;">
  <h2 style="margin: 0 0 16px;">New feedback — ${ticketId}</h2>
  <table style="border-collapse: collapse; width: 100%; max-width: 560px;">
    <tr><td style="padding: 6px 12px 6px 0; font-weight: bold;">Ticket ID</td><td>${ticketId}</td></tr>
    <tr><td style="padding: 6px 12px 6px 0; font-weight: bold;">Category</td><td>${category}</td></tr>
    <tr><td style="padding: 6px 12px 6px 0; font-weight: bold;">Title</td><td>${title}</td></tr>
    <tr><td style="padding: 6px 12px 6px 0; font-weight: bold;">Agency</td><td>${agencyLabel}</td></tr>
    <tr><td style="padding: 6px 12px 6px 0; font-weight: bold;">Submitted by</td><td>${submitterName} &lt;${submitterEmail}&gt;</td></tr>
    <tr><td style="padding: 6px 12px 6px 0; font-weight: bold;">Submitted at</td><td>${formatWhen(createdAt)}</td></tr>
    ${attachmentRow}
  </table>
  <h3 style="margin: 24px 0 8px;">Description</h3>
  <p style="white-space: pre-wrap; background: #f5f5f5; padding: 12px; border-radius: 4px;">${description}</p>
  <p style="margin-top: 24px; font-size: 12px; color: #666;">Reply directly to this email to reach ${submitterEmail}.</p>
</body>
</html>`;
}

function feedbackStatusUpdateEmail({
  ticketId,
  title,
  status,
  note,
  updatedByName,
  updatedByEmail,
  agencyName,
  attachmentNames = [],
  createdAt,
  intro,
}) {
  const attachmentRow =
    attachmentNames.length > 0
      ? `<tr><td style="padding: 6px 12px 6px 0; font-weight: bold;">Attachments</td><td>${attachmentNames.join("<br/>")}</td></tr>`
      : "";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.5; color: #222;">
  <h2 style="margin: 0 0 16px;">${intro || "Feedback update"} — ${ticketId}</h2>
  <p style="margin: 0 0 16px;">${intro || "Your feedback ticket has been updated."}</p>
  <table style="border-collapse: collapse; width: 100%; max-width: 560px;">
    <tr><td style="padding: 6px 12px 6px 0; font-weight: bold;">Ticket ID</td><td>${ticketId}</td></tr>
    <tr><td style="padding: 6px 12px 6px 0; font-weight: bold;">Title</td><td>${title}</td></tr>
    <tr><td style="padding: 6px 12px 6px 0; font-weight: bold;">Agency</td><td>${agencyName}</td></tr>
    <tr><td style="padding: 6px 12px 6px 0; font-weight: bold;">New status</td><td>${status}</td></tr>
    <tr><td style="padding: 6px 12px 6px 0; font-weight: bold;">Updated by</td><td>${updatedByName} &lt;${updatedByEmail}&gt;</td></tr>
    <tr><td style="padding: 6px 12px 6px 0; font-weight: bold;">Updated at</td><td>${formatWhen(createdAt)}</td></tr>
    ${attachmentRow}
  </table>
  <h3 style="margin: 24px 0 8px;">Update note</h3>
  <p style="white-space: pre-wrap; background: #f5f5f5; padding: 12px; border-radius: 4px;">${note || "—"}</p>
</body>
</html>`;
}

module.exports = { feedbackSubmittedEmail, feedbackStatusUpdateEmail };
