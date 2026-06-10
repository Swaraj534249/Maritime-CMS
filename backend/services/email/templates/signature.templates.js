/**
 * Reusable agency signature block appended to outgoing emails. We send from the
 * platform address, so the signature tells the recipient which agency it is on
 * behalf of. Same format across all emails; keep emails themselves separate.
 */

function escapeHtml(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatWhen(date) {
  return new Date(date || Date.now()).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
  });
}

function buildAgencySignature({
  // Acting agent (sender)
  signerName,
  signerRole,
  signerPhone,
  signerEmail,
  // Agency
  agencyName,
  agencyShortName,
  agencyAddress,
  agencyPhone,
  licenseNumber,
  agencyEmail,
  replyTo,
} = {}) {
  const agencyLabel = agencyShortName
    ? `${agencyName} (${agencyShortName})`
    : agencyName || "";

  const agentLine = [signerName, signerRole].filter(Boolean).join(" · ");
  const agentContact = [];
  if (signerPhone) agentContact.push(`Phone: ${escapeHtml(signerPhone)}`);
  if (signerEmail) agentContact.push(`Email: ${escapeHtml(signerEmail)}`);

  const reply = replyTo || agencyEmail || signerEmail || "";

  return `
  <div style="font-family:Arial,sans-serif;font-size:13px;color:#444;border-left:3px solid #0b3d59;background:#f8fafc;padding:14px 16px;margin:28px 0 0;border-radius:4px;">
    <p style="margin:0 0 8px;color:#888;">Thanks &amp; Regards,</p>
    ${agentLine ? `<p style="margin:0;font-weight:bold;color:#222;">${escapeHtml(agentLine)}</p>` : ""}
    ${agentContact.length ? `<p style="margin:2px 0 0;">${agentContact.join(" &nbsp;&nbsp; ")}</p>` : ""}

    ${agencyLabel ? `<p style="margin:14px 0 0;font-weight:bold;color:#222;font-size:14px;">${escapeHtml(agencyLabel)}</p>` : ""}
    ${agencyAddress ? `<p style="margin:2px 0 0;">Agency Address: ${escapeHtml(agencyAddress)}</p>` : ""}
    ${agencyPhone ? `<p style="margin:2px 0 0;">Admin No.: ${escapeHtml(agencyPhone)}</p>` : ""}
    ${licenseNumber ? `<p style="margin:2px 0 0;">License: ${escapeHtml(licenseNumber)}</p>` : ""}

    <p style="margin:14px 0 0;font-size:11px;color:#999;">****This is a system-generated email sent on behalf of ${escapeHtml(
      agencyName || "the agency",
    )}.${reply ? ` You may reply to ${escapeHtml(reply)}` : ""}****</p>
  </div>`;
}

/** Outer card shell shared by emails so they all look consistent. */
function emailShell(bodyHtml) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:24px;background:#eef1f4;font-family:Arial,sans-serif;line-height:1.5;color:#222;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e3e7eb;border-radius:8px;padding:24px;">
    ${bodyHtml}
  </div>
</body>
</html>`;
}

/** Boxed key/value details, styled to match the signature block. */
function detailBox(rows = []) {
  const body = rows
    .filter(([, value]) => value != null && value !== "")
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 16px 6px 0;color:#888;font-size:12px;white-space:nowrap;vertical-align:top;">${escapeHtml(
          label,
        )}</td><td style="padding:6px 0;font-weight:600;color:#222;">${escapeHtml(
          String(value),
        )}</td></tr>`,
    )
    .join("");
  if (!body) return "";
  return `<div style="border-left:3px solid #0b3d59;background:#f8fafc;padding:10px 16px;border-radius:4px;">
    <table style="border-collapse:collapse;width:100%;">${body}</table>
  </div>`;
}

module.exports = {
  escapeHtml,
  formatWhen,
  buildAgencySignature,
  emailShell,
  detailBox,
};
