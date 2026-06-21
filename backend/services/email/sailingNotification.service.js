const { sendMail } = require("../../utils/Emails");
const { enqueueEmailJob } = require("./emailQueue.service");
const { sailingEmail } = require("./templates/sailing.templates");
const { buildAgencySignature } = require("./templates/signature.templates");
const { getAgencyAdminEmails } = require("./recipients");
const { supportBcc } = require("./mailIdentities");
const Agency = require("../../models/Agency");
const User = require("../../models/User");

/**
 * Notify the signed-on candidate and all agency staff that the contract is
 * approved (a new sailing was created). Best-effort, queued after the response.
 */
function queueSailingEmails({ sailing, candidateEmail }) {
  if (!sailing) return;

  enqueueEmailJob(async () => {
    const [agency, staff] = await Promise.all([
      sailing.agencyId ? Agency.findById(sailing.agencyId).lean() : null,
      User.find({
        agencyId: sailing.agencyId,
        role: { $in: ["AGENT", "AGENCY_ADMIN"] },
        status: { $ne: "inactive" },
      })
        .select("email")
        .lean(),
    ]);

    const signatureHtml = buildAgencySignature({
      agencyName: agency?.name,
      agencyShortName: agency?.shortName,
      agencyAddress: agency?.address,
      agencyPhone: agency?.phone,
      licenseNumber: agency?.licenseNumber,
      agencyEmail: agency?.email,
      replyTo: agency?.email,
    });

    const base = {
      candidateName: sailing.candidateName,
      rank: sailing.rank,
      indosNumber: sailing.indosNumber,
      passportNumber: sailing.passportNumber,
      cdcNumber: sailing.cdcNumber,
      vacancyCode: sailing.vacancyCode,
      vesselOwnerName: sailing.vesselOwnerName,
      vesselName: sailing.vesselName,
      leavingDate: sailing.leavingDate,
      signOnDate: sailing.signOnDate,
      contractDurationMonths: sailing.contractDurationMonths,
      signatureHtml,
    };

    // Candidate email (BCC agency admin + temporary support monitoring).
    if (candidateEmail) {
      const adminEmails = await getAgencyAdminEmails(sailing.agencyId);
      const candidateBcc = [...new Set([...adminEmails, ...supportBcc()])].filter(
        Boolean,
      );
      const html = sailingEmail({ ...base, forCandidate: true });
      await sendMail(
        candidateEmail,
        `Contract Approved — ${sailing.vacancyCode || ""}`.trim(),
        html,
        { replyTo: agency?.email, bcc: candidateBcc },
      );
    }

    // Agency staff email (temporary support monitoring only).
    const staffHtml = sailingEmail({ ...base, forCandidate: false });
    const staffSubject = `Contract Approved — ${sailing.candidateName || "Candidate"} (${sailing.vacancyCode || ""})`;
    const emails = [...new Set((staff || []).map((u) => u.email).filter(Boolean))];
    emails.forEach((to) => {
      enqueueEmailJob(() =>
        sendMail(to, staffSubject, staffHtml, {
          replyTo: agency?.email,
          bcc: supportBcc(),
        }),
      );
    });
  });
}

module.exports = { queueSailingEmails };
