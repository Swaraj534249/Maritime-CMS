const nodemailer = require("nodemailer");
const { sendSesEmail, sendSesRawEmail } = require("../aws/ses/sendEmail.service");

let smtpTransporter;

function getSmtpTransporter() {
  if (!smtpTransporter) {
    smtpTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL, pass: process.env.PASSWORD },
    });
  }
  return smtpTransporter;
}

function mapAttachments(attachments = []) {
  return attachments.map((a) => ({
    filename: a.filename || a.originalName || "attachment",
    content: a.content || a.buffer,
    contentType: a.contentType || a.mimetype,
  }));
}

exports.sendMail = async (receiverEmail, subject, body, options = {}) => {
  const { replyTo, cc, attachments } = options;
  const mailAttachments = mapAttachments(attachments);
  const hasExtras = mailAttachments.length > 0 || (cc && cc.length > 0);

  if (process.env.EMAIL_PROVIDER === "ses") {
    if (hasExtras) {
      return sendSesRawEmail({
        to: receiverEmail,
        cc,
        subject,
        html: body,
        replyTo,
        attachments: mailAttachments,
      });
    }
    return sendSesEmail({ to: receiverEmail, subject, html: body, replyTo });
  }

  await getSmtpTransporter().sendMail({
    from: process.env.EMAIL,
    to: receiverEmail,
    cc,
    subject,
    html: body,
    ...(replyTo ? { replyTo } : {}),
    attachments: mailAttachments,
  });
};
