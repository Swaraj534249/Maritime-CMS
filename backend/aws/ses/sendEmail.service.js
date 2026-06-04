const {
  SendEmailCommand,
  SendRawEmailCommand,
} = require("@aws-sdk/client-ses");
const MailComposer = require("nodemailer/lib/mail-composer");
const { getSesClient } = require("../clients");
const { getSesFromEmail } = require("../env");

async function sendSesEmail({ to, subject, html, text, replyTo, cc }) {
  if (cc?.length) {
    return sendSesRawEmail({ to, cc, subject, html, replyTo });
  }
  const command = new SendEmailCommand({
    Source: getSesFromEmail(),
    Destination: { ToAddresses: [to] },
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

async function sendSesRawEmail({ to, cc, subject, html, replyTo, attachments = [] }) {
  const mail = new MailComposer({
    from: getSesFromEmail(),
    to,
    cc,
    subject,
    html,
    replyTo,
    attachments,
  });
  const message = await mail.compile().build();
  const destinations = []
    .concat(to)
    .concat(cc || [])
    .filter(Boolean);
  return getSesClient().send(
    new SendRawEmailCommand({
      Source: getSesFromEmail(),
      Destinations: destinations,
      RawMessage: { Data: message },
    }),
  );
}

module.exports = { sendSesEmail, sendSesRawEmail };
