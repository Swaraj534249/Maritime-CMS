const { sendMail } = require("../../utils/Emails");
const { enqueueEmailJob } = require("./emailQueue.service");
const { candidateProposedEmail } = require("./templates/proposal.templates");
const { buildAgencySignature } = require("./templates/signature.templates");

/** Notify a candidate that they have been proposed to a vacancy. */
function queueCandidateProposedEmail({ candidate, vacancy, agency, signer }) {
  if (!candidate?.email || !vacancy) return;

  const replyTo = agency?.email || signer?.email;
  const signatureHtml = buildAgencySignature({
    signerName: signer?.name,
    signerRole: signer?.userType,
    signerPhone: signer?.phone,
    signerEmail: signer?.email,
    agencyName: agency?.name,
    agencyShortName: agency?.shortName,
    agencyAddress: agency?.address,
    agencyPhone: agency?.phone,
    licenseNumber: agency?.licenseNumber,
    agencyEmail: agency?.email,
    replyTo,
  });

  const html = candidateProposedEmail({
    candidateName: candidate.name,
    vacancyId: vacancy.vacancyId,
    vesselOwner: vacancy.vesselOwnerName,
    vessel: vacancy.vesselName,
    vesselType: vacancy.vesselType,
    rank: vacancy.rank,
    salary: vacancy.salary,
    signOnDate: vacancy.signOnDate,
    contractDurationMonths: vacancy.contractDurationMonths,
    signatureHtml,
  });

  const subject = `You have been proposed for ${vacancy.vacancyId}`;

  enqueueEmailJob(() =>
    sendMail(candidate.email, subject, html, { replyTo }),
  );
}

module.exports = { queueCandidateProposedEmail };
