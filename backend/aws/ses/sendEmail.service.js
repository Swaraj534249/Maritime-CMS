const {
  SendEmailCommand,
  SendRawEmailCommand,
} = require("@aws-sdk/client-ses");
const MailComposer = require("nodemailer/lib/mail-composer");
const { getSesClient } = require("../clients");
const { getSesFromEmail } = require("../env");

function toArray(value) {
  if (!value) return [];
  return (Array.isArray(value) ? value : [value]).filter(Boolean);
}

/** SES SendRawEmail wants a bare address as Source even if the From header has a display name. */
function bareEmail(addr) {
  if (!addr) return addr;
  const match = String(addr).match(/<([^>]+)>/);
  return (match ? match[1] : addr).trim();
}

async function sendSesEmail({ to, subject, html, text, replyTo, cc, bcc, from }) {
  const ccArr = toArray(cc);
  const bccArr = toArray(bcc);
  const command = new SendEmailCommand({
    Source: from || getSesFromEmail(),
    Destination: {
      ToAddresses: toArray(to),
      ...(ccArr.length ? { CcAddresses: ccArr } : {}),
      ...(bccArr.length ? { BccAddresses: bccArr } : {}),
    },
    ReplyToAddresses: replyTo ? [replyTo] : undefined,
    Message: {
      Subject: { Data: subject, Charset: "UTF-8" },
      Body: {
        Html: { Data: html, Charset: "UTF-8" },
        ...(text ? { Text: { Data: text, Charset: "UTF-8" } } : {}),
      },
    },
  });
  return getSesClient().send(command);
}

async function sendSesRawEmail({
  to,
  cc,
  bcc,
  subject,
  html,
  replyTo,
  attachments = [],
  from,
}) {
  const ccArr = toArray(cc);
  const bccArr = toArray(bcc);
  // BCC is intentionally NOT passed to MailComposer so it never appears in the
  // message headers; recipients are added to the SES envelope (Destinations) only.
  const mail = new MailComposer({
    from: from || getSesFromEmail(),
    to,
    ...(ccArr.length ? { cc: ccArr } : {}),
    subject,
    html,
    replyTo,
    attachments,
  });
  const message = await mail.compile().build();
  const destinations = toArray(to).concat(ccArr).concat(bccArr);
  return getSesClient().send(
    new SendRawEmailCommand({
      Source: bareEmail(from || getSesFromEmail()),
      Destinations: destinations,
      RawMessage: { Data: message },
    }),
  );
}

module.exports = { sendSesEmail, sendSesRawEmail };
