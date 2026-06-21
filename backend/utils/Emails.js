const nodemailer = require("nodemailer");
const { sendSesEmail, sendSesRawEmail } = require("../aws/ses/sendEmail.service");

let smtpTransporter;

function getSmtpTransporter() {
  if (!smtpTransporter) {
    const host = process.env.SMTP_HOST;
    if (host) {
      const port = Number(process.env.SMTP_PORT) || 465;
      smtpTransporter = nodemailer.createTransport({
        host,
        port,
        secure: process.env.SMTP_SECURE
          ? process.env.SMTP_SECURE === "true"
          : port === 465,
        auth: { user: process.env.EMAIL, pass: process.env.PASSWORD },
      });
    } else {
      // Fallback: Gmail SMTP (needs an app password) when no SMTP_HOST is set.
      smtpTransporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.EMAIL, pass: process.env.PASSWORD },
      });
    }
  }
  return smtpTransporter;
}

// From address shown to recipients. Can be a plain address or "Name <addr>".
function getMailFrom() {
  return (
    process.env.MAIL_FROM || process.env.SES_FROM_EMAIL || process.env.EMAIL
  );
}

function mapAttachments(attachments = []) {
  return attachments.map((a) => ({
    filename: a.filename || a.originalName || "attachment",
    content: a.content || a.buffer,
    contentType: a.contentType || a.mimetype,
  }));
}

exports.sendMail = async (receiverEmail, subject, body, options = {}) => {
  const { cc, bcc, from, attachments } = options;
  // Fall back to a default Reply-To (e.g. support@) so replies reach a real inbox.
  const replyTo = options.replyTo || process.env.MAIL_REPLY_TO || undefined;
  const mailAttachments = mapAttachments(attachments);
  const hasExtras =
    mailAttachments.length > 0 ||
    (cc && cc.length > 0) ||
    (bcc && bcc.length > 0);

  if (process.env.EMAIL_PROVIDER === "ses") {
    if (hasExtras) {
      return sendSesRawEmail({
        to: receiverEmail,
        cc,
        bcc,
        subject,
        html: body,
        replyTo,
        attachments: mailAttachments,
        from,
      });
    }
    return sendSesEmail({
      to: receiverEmail,
      subject,
      html: body,
      replyTo,
      from,
    });
  }

  await getSmtpTransporter().sendMail({
    from: from || getMailFrom(),
    to: receiverEmail,
    cc,
    bcc,
    subject,
    html: body,
    ...(replyTo ? { replyTo } : {}),
    attachments: mailAttachments,
  });
};
