const {
  escapeHtml,
  formatWhen,
  emailShell,
  detailBox,
} = require("./signature.templates");

function candidateProposedEmail({
  candidateName,
  vacancyId,
  vesselOwner,
  vessel,
  vesselType,
  rank,
  salary,
  signOnDate,
  contractDurationMonths,
  signatureHtml = "",
}) {
  const body = `
    <h2 style="margin:0 0 16px;font-size:20px;color:#0b3d59;">You have been proposed for a vacancy</h2>
    <p style="margin:0 0 16px;">Dear ${escapeHtml(
      candidateName || "Candidate",
    )}, you have been proposed for the following vacancy. Our team will contact you regarding the next steps.</p>
    ${detailBox([
      ["Vacancy ID", vacancyId],
      ["Rank", rank],
      ["Vessel Owner", vesselOwner],
      ["Vessel", vessel],
      ["Vessel Type", vesselType],
      ["Salary", salary],
      ["Sign-on Date", signOnDate ? formatWhen(signOnDate) : ""],
      ["Contract", contractDurationMonths ? `${contractDurationMonths} months` : ""],
    ])}
    ${signatureHtml}`;
  return emailShell(body);
}

module.exports = { candidateProposedEmail };
