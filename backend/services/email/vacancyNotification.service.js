const { sendMail } = require("../../utils/Emails");
const { enqueueEmailJob } = require("./emailQueue.service");
const { vacancyCreatedEmail } = require("./templates/vacancy.templates");
const { buildAgencySignature } = require("./templates/signature.templates");

/**
 * Notify all agency staff that a new vacancy was created.
 * (Later this can be narrowed to sourcing agents by userType.)
 */
function queueVacancyCreatedEmail({
  vacancy,
  agency,
  signer,
  recipientEmails = [],
}) {
  const emails = [...new Set((recipientEmails || []).filter(Boolean))];
  if (!emails.length || !vacancy) return;

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

  const html = vacancyCreatedEmail({
    vacancyId: vacancy.vacancyId,
    vesselOwner: vacancy.vesselOwnerName,
    vessel: vacancy.vesselName,
    vesselType: vacancy.vesselType,
    flag: vacancy.flag,
    rank: vacancy.rank,
    openings: vacancy.openings,
    salary: vacancy.salary,
    signOnDate: vacancy.signOnDate,
    contractDurationMonths: vacancy.contractDurationMonths,
    signatureHtml,
  });

  const subject = `[${vacancy.vacancyId}] New Vacancy — ${vacancy.rank}`;

  emails.forEach((to) => {
    enqueueEmailJob(() => sendMail(to, subject, html, { replyTo }));
  });
}

module.exports = { queueVacancyCreatedEmail };
