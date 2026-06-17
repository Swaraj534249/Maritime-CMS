const {
  escapeHtml,
  formatDate,
  emailShell,
  detailBox,
} = require("./signature.templates");

const fmtDate = (d) => formatDate(d);

// "Contract Approved" email sent when a candidate is signed on (a sailing is created).
function sailingEmail({
  candidateName,
  rank,
  indosNumber,
  passportNumber,
  cdcNumber,
  vacancyCode,
  vesselOwnerName,
  vesselName,
  leavingDate,
  signOnDate,
  contractDurationMonths,
  forCandidate = false,
  signatureHtml = "",
}) {
  const intro = forCandidate
    ? `Dear ${escapeHtml(candidateName || "Candidate")}, your contract has been approved. Your sign-on details are below.`
    : `The contract for ${escapeHtml(candidateName || "a candidate")} has been approved. Details below.`;

  const body = `
    <h2 style="margin:0 0 16px;font-size:20px;color:#0b3d59;">Contract Approved</h2>
    <p style="margin:0 0 16px;">${intro}</p>
    ${detailBox([
      ["Candidate", candidateName],
      ["Rank", rank],
      ["INDOS", indosNumber],
      ["Passport", passportNumber],
      ["CDC", cdcNumber],
      ["Vacancy ID", vacancyCode],
      ["Company", vesselOwnerName],
      ["Vessel", vesselName],
      ["Leaving Date", fmtDate(leavingDate)],
      ["Sign-on Date", fmtDate(signOnDate)],
      ["Contract", contractDurationMonths ? `${contractDurationMonths} months` : ""],
    ])}
    ${signatureHtml}`;
  return emailShell(body);
}

module.exports = { sailingEmail };
