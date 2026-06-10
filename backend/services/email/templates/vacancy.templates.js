const {
  escapeHtml,
  formatWhen,
  emailShell,
  detailBox,
} = require("./signature.templates");

function vacancyCreatedEmail({
  vacancyId,
  vesselOwner,
  vessel,
  vesselType,
  flag,
  rank,
  openings,
  salary,
  signOnDate,
  contractDurationMonths,
  signatureHtml = "",
}) {
  const body = `
    <h2 style="margin:0 0 4px;font-size:20px;color:#0b3d59;">New Vacancy</h2>
    <p style="margin:0 0 16px;color:#888;font-size:13px;">${escapeHtml(vacancyId)}</p>
    <p style="margin:0 0 16px;">A new vacancy has been created in your agency.</p>
    ${detailBox([
      ["Vessel Owner", vesselOwner],
      ["Vessel", vessel],
      ["Vessel Type", vesselType],
      ["Flag", flag],
      ["Rank", rank],
      ["Openings", openings],
      ["Salary", salary],
      ["Sign-on Date", signOnDate ? formatWhen(signOnDate) : ""],
      ["Contract", contractDurationMonths ? `${contractDurationMonths} months` : ""],
    ])}
    ${signatureHtml}`;
  return emailShell(body);
}

module.exports = { vacancyCreatedEmail };
