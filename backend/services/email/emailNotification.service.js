const { sendMail } = require("../../utils/Emails");
const { enqueueEmailJob } = require("./emailQueue.service");
const {
  agentWelcomeEmail,
  agencyAdminWelcomeEmail,
  adminPasswordChangedNoticeEmail,
} = require("./templates/userLifecycle.templates");
const { issuePasswordSetupLink } = require("./passwordSetupLink.service");

/**
 * Creates reset token in DB (await), then queues only SMTP so HTTP stays fast.
 */
async function prepareAndQueueAgentWelcome({ user, agencyName }) {
  const { resetUrl } = await issuePasswordSetupLink(user);
  const loginUrl = `${process.env.ORIGIN || ""}/login`;
  const html = agentWelcomeEmail({
    name: user.name,
    agencyName,
    loginUrl,
    resetUrl,
  });
  const subject = `Welcome — set your password (${agencyName})`;
  enqueueEmailJob(() => sendMail(user.email, subject, html));
}

async function prepareAndQueueAgencyAdminWelcome({
  user,
  agencyName,
  industryType,
  subscriptionPlan,
  maxAgents,
  contactPerson,
}) {
  const { resetUrl } = await issuePasswordSetupLink(user);
  const loginUrl = `${process.env.ORIGIN || ""}/login`;
  const html = agencyAdminWelcomeEmail({
    contactPerson,
    agencyName,
    industryType,
    subscriptionPlan,
    maxAgents,
    loginUrl,
    resetUrl,
  });
  enqueueEmailJob(() =>
    sendMail(user.email, "Your agency is ready — set your password", html),
  );
}

function queueAdminPasswordChangedNotice({ email, name }) {
  const loginUrl = `${process.env.ORIGIN || ""}/login`;
  const html = adminPasswordChangedNoticeEmail({ name, loginUrl });
  enqueueEmailJob(() => sendMail(email, "Your password was updated", html));
}

module.exports = {
  prepareAndQueueAgentWelcome,
  prepareAndQueueAgencyAdminWelcome,
  queueAdminPasswordChangedNotice,
};
