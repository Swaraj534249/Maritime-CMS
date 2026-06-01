/** HTML email bodies — keep logic out of controllers/services. */

function agentWelcomeEmail({ name, agencyName, loginUrl, resetUrl }) {
  return `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333;">Welcome to ${escapeHtml(agencyName)}</h2>
  <p>Hello ${escapeHtml(name)},</p>
  <p>Your agent account has been created.</p>
  <p><strong>Set your password</strong> using the secure link below (valid for a limited time). Do not share this link.</p>
  <p style="margin: 24px 0;"><a href="${resetUrl}" style="background:#007bff;color:#fff;padding:12px 20px;text-decoration:none;border-radius:4px;">Set your password</a></p>
  <p>Or open this URL in your browser:<br/><span style="word-break:break-all;color:#007bff;">${resetUrl}</span></p>
  <p>After setting your password, sign in at <a href="${loginUrl}">${loginUrl}</a>.</p>
  <p>If you did not expect this email, you can ignore it.</p>
  <p style="margin-top: 30px;">Best regards,<br/><strong>${escapeHtml(agencyName)}</strong></p>
</div>`;
}

function agencyAdminWelcomeEmail({
  contactPerson,
  agencyName,
  industryType,
  subscriptionPlan,
  maxAgents,
  loginUrl,
  resetUrl,
}) {
  return `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333;">Welcome</h2>
  <p>Hello ${escapeHtml(contactPerson)},</p>
  <p>Your agency <strong>${escapeHtml(agencyName)}</strong> has been registered and your admin account is ready.</p>
  <ul>
    <li><strong>Industry:</strong> ${escapeHtml(industryType)}</li>
    <li><strong>Plan:</strong> ${escapeHtml(subscriptionPlan || "basic")}</li>
    <li><strong>Max agents:</strong> ${escapeHtml(String(maxAgents ?? 5))}</li>
  </ul>
  <p><strong>Set your password</strong> using the secure link below (valid for a limited time):</p>
  <p style="margin: 24px 0;"><a href="${resetUrl}" style="background:#007bff;color:#fff;padding:12px 20px;text-decoration:none;border-radius:4px;">Set your password</a></p>
  <p>Then sign in at <a href="${loginUrl}">${loginUrl}</a>.</p>
  <p style="margin-top: 30px;">— Platform administration</p>
</div>`;
}

function adminPasswordChangedNoticeEmail({ name, loginUrl }) {
  return `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333;">Password updated</h2>
  <p>Hello ${escapeHtml(name)},</p>
  <p>Your account password was changed by an administrator.</p>
  <p>If you did not expect this, contact your administrator immediately.</p>
  <p>Sign in: <a href="${loginUrl}">${loginUrl}</a></p>
  <p>You can use <strong>Forgot password</strong> on the login page if you need to set a new password yourself.</p>
</div>`;
}

function escapeHtml(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

module.exports = {
  agentWelcomeEmail,
  agencyAdminWelcomeEmail,
  adminPasswordChangedNoticeEmail,
};
