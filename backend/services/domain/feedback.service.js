const path = require("path");
const Feedback = require("../../models/Feedback");
const Agency = require("../../models/Agency");
const User = require("../../models/User");
const { AppError } = require("../../errors/AppError");
const { buildListQuery } = require("../../utils/ListQueryBuilder");
const { buildListResponse } = require("../../utils/ListResponseBuilder");
const { computeStatusCounts } = require("../../utils/statusCounts");
const { buildTicketPrefix, formatTicketId } = require("../../utils/feedbackTicketId");
const {
  queueFeedbackSubmittedEmail,
  queueFeedbackResolvedEmail,
  queueFeedbackReopenedEmail,
  queueFeedbackReminderEmail,
} = require("../email/feedbackNotification.service");
const { uploadBuffer } = require("../../aws/s3/storage.service");
const { resolveTenantKeyForUpload, tenantKeyFromAgencyFields } = require("../../middleware/upload");
const { normalizeFeedback, fileWithPath } = require("../../utils/feedbackFiles");

const FEEDBACK_STATUSES = ["open", "in_progress", "resolved", "closed", "reopened"];

const ADMIN_STATUS_OPTIONS = ["in_progress", "resolved"];
const REMINDER_ACTION = "reminder";
const AGENT_STATUS_OPTIONS = ["closed", "reopened"];

async function resolveAgencyForUser(req) {
  if (req.user.role === "SUPER_ADMIN") {
    throw new AppError(403, "Super admin cannot submit feedback from this form");
  }
  if (!req.user.agencyId) {
    throw new AppError(400, "Agency is required to submit feedback");
  }
  const agency = await Agency.findById(req.user.agencyId);
  if (!agency) throw new AppError(404, "Agency not found");
  return agency;
}

async function resolveFeedbackTenantKey(feedbackDoc) {
  let shortName = feedbackDoc.agencyShortName;
  let name = feedbackDoc.agencyName;
  if (!shortName?.trim() && !name?.trim() && feedbackDoc.agencyId) {
    const agency = await Agency.findById(feedbackDoc.agencyId).select(
      "shortName name",
    );
    shortName = agency?.shortName;
    name = agency?.name;
  }
  return tenantKeyFromAgencyFields({ shortName, name });
}

async function uploadFeedbackFiles(req, files, ticketId, subfolder = "", feedbackDoc = null) {
  if (!files?.length) return [];

  const tenantKey =
    (feedbackDoc && (await resolveFeedbackTenantKey(feedbackDoc))) ||
    resolveTenantKeyForUpload(req);
  if (!tenantKey || tenantKey === "unknown") {
    throw new AppError(400, "Agency short name or name is required for attachments");
  }

  const uploaded = [];
  for (const file of files) {
    if (!file?.buffer?.length) continue;
    const ext = path.extname(file.originalname) || "";
    const safeBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9.-]/g, "_")
      .slice(0, 60);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const filename = `${safeBase}-${unique}${ext}`;
    const folder = subfolder ? `${subfolder}/` : "";
    const key = `${tenantKey}/feedback/${ticketId}/${folder}${filename}`;

    await uploadBuffer(file.buffer, key, file.mimetype);

    uploaded.push(
      fileWithPath({
        filename,
        originalName: file.originalname,
        key,
        mimetype: file.mimetype,
        size: file.size,
        uploadedAt: new Date(),
      }),
    );
  }
  return uploaded;
}

async function actorFromReq(req) {
  const user = await User.findById(req.user._id).select("name email role");
  if (!user) throw new AppError(404, "User not found");
  return {
    userId: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

async function submit(req) {
  const { category, title, description } = req.body;
  if (!category || !title?.trim() || !description?.trim()) {
    throw new AppError(400, "Category, title, and description are required");
  }

  const agency = await resolveAgencyForUser(req);
  const submitter = await User.findById(req.user._id).select("name email");
  if (!submitter) throw new AppError(404, "User not found");

  const updatedAgency = await Agency.findByIdAndUpdate(
    agency._id,
    { $inc: { feedbackCounter: 1 } },
    { new: true },
  );
  const sequenceNumber = updatedAgency.feedbackCounter;
  const ticketId = formatTicketId(buildTicketPrefix(updatedAgency), sequenceNumber);

  const files = req.files?.length ? req.files : req.file ? [req.file] : [];
  const attachments = await uploadFeedbackFiles(req, files, ticketId, "submission");

  const submittedBy = {
    userId: submitter._id,
    name: submitter.name,
    email: submitter.email,
  };

  const initialUpdate = {
    status: "open",
    note: description.trim(),
    attachments,
    createdBy: { ...submittedBy, role: req.user.role },
    createdAt: new Date(),
  };

  const feedback = await Feedback.create({
    ticketId,
    agencyId: agency._id,
    agencyName: agency.name,
    agencyShortName: agency.shortName || "",
    category,
    title: title.trim(),
    description: description.trim(),
    attachments,
    submittedBy,
    status: "open",
    sequenceNumber,
    updates: [initialUpdate],
  });

  queueFeedbackSubmittedEmail(feedback.toObject(), files);
  return normalizeFeedback(feedback);
}

async function list(req) {
  const {
    page = 1,
    limit = 10,
    sortField = "createdAt",
    sortOrder = "desc",
    searchValue = "",
    status,
  } = req.query;

  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const pageSizeNumber = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

  const extraFilter = {};
  if (req.user.role !== "SUPER_ADMIN") {
    if (!req.user.agencyId) {
      throw new AppError(400, "Agency context is required");
    }
    extraFilter.agencyId = req.user.agencyId;
  }
  if (status) extraFilter.status = status;

  const { queryFilter, skip, sort } = buildListQuery({
    Model: Feedback,
    searchValue,
    searchFields: ["ticketId", "title", "category", "submittedBy.email", "submittedBy.name"],
    page: pageNumber,
    pageSize: pageSizeNumber,
    sortField,
    sortOrder,
    extraFilter,
  });

  const [data, totalRecords] = await Promise.all([
    Feedback.find(queryFilter).skip(skip).limit(pageSizeNumber).sort(sort).lean(),
    Feedback.countDocuments(queryFilter),
  ]);

  return buildListResponse({
    data: data.map(normalizeFeedback),
    page: pageNumber,
    pageSize: pageSizeNumber,
    totalRecords,
    searchValue,
    sortField,
    sortOrder,
    aggregates: {},
    context: {},
  });
}

async function statusCounts(req) {
  const { searchValue = "" } = req.query;
  const extraFilter = {};
  if (req.user.role !== "SUPER_ADMIN") {
    if (!req.user.agencyId) {
      throw new AppError(400, "Agency context is required");
    }
    extraFilter.agencyId = req.user.agencyId;
  }
  const { queryFilter } = buildListQuery({
    Model: Feedback,
    searchValue,
    searchFields: ["ticketId", "title", "category", "submittedBy.email", "submittedBy.name"],
    page: 1,
    pageSize: 1,
    extraFilter,
  });
  return computeStatusCounts({
    Model: Feedback,
    matchFilter: queryFilter,
    field: "status",
  });
}

async function getById(req) {
  const feedback = await Feedback.findById(req.params.id).lean();
  if (!feedback) throw new AppError(404, "Feedback not found");

  if (
    req.user.role !== "SUPER_ADMIN" &&
    feedback.agencyId.toString() !== req.user.agencyId?.toString()
  ) {
    throw new AppError(403, "Access denied");
  }

  return normalizeFeedback(feedback);
}

async function getAgencyAdminEmails(agencyId) {
  const admins = await User.find({
    agencyId,
    role: "AGENCY_ADMIN",
    status: { $ne: "inactive" },
  }).select("email");
  return admins.map((a) => a.email).filter(Boolean);
}

async function updateById(req) {
  const feedbackDoc = await Feedback.findById(req.params.id);
  if (!feedbackDoc) throw new AppError(404, "Feedback not found");

  if (
    req.user.role !== "SUPER_ADMIN" &&
    feedbackDoc.agencyId.toString() !== req.user.agencyId?.toString()
  ) {
    throw new AppError(403, "Access denied");
  }

  const { status, note } = req.body;
  if (!status) {
    throw new AppError(400, "Status is required");
  }

  const files = req.files?.length ? req.files : req.file ? [req.file] : [];
  const isReminder = status === REMINDER_ACTION;

  if (req.user.role === "SUPER_ADMIN") {
    if (isReminder) {
      if (feedbackDoc.status !== "resolved") {
        throw new AppError(
          400,
          "Reminders can only be sent while waiting for the submitter to close or reopen",
        );
      }
    } else if (feedbackDoc.status === "resolved") {
      throw new AppError(
        400,
        "Ticket is awaiting agent response — send a reminder instead",
      );
    } else if (!ADMIN_STATUS_OPTIONS.includes(status)) {
      throw new AppError(400, "Super admin can set status to in_progress or resolved");
    } else if (status === "resolved" && !note?.trim()) {
      throw new AppError(400, "Resolution note is required when marking as resolved");
    } else if (!FEEDBACK_STATUSES.includes(status)) {
      throw new AppError(400, "Invalid status");
    }
  } else {
    if (isReminder) {
      throw new AppError(403, "Only super admin can send reminders");
    }
    if (!FEEDBACK_STATUSES.includes(status)) {
      throw new AppError(400, "Invalid status");
    }
    if (feedbackDoc.status !== "resolved") {
      throw new AppError(400, "You can respond only after the ticket is resolved");
    }
    if (!AGENT_STATUS_OPTIONS.includes(status)) {
      throw new AppError(400, "You can close or reopen this ticket");
    }
    if (status === "reopened" && !note?.trim()) {
      throw new AppError(400, "Please describe why the issue is not resolved");
    }
  }

  const subfolder = `update-${status}-${Date.now()}`;
  const attachments = await uploadFeedbackFiles(
    req,
    files,
    feedbackDoc.ticketId,
    subfolder,
    feedbackDoc,
  );

  const updateEntry = {
    status,
    note: note?.trim() || "",
    attachments,
    createdBy: await actorFromReq(req),
    createdAt: new Date(),
  };

  feedbackDoc.updates.push(updateEntry);
  if (!isReminder) {
    feedbackDoc.status = status;
  }
  await feedbackDoc.save();

  const normalized = normalizeFeedback(feedbackDoc);

  if (isReminder) {
    const cc = await getAgencyAdminEmails(feedbackDoc.agencyId);
    queueFeedbackReminderEmail({
      feedback: normalized,
      update: updateEntry,
      fileBuffers: files,
      cc,
    });
  } else if (status === "resolved") {
    const cc = await getAgencyAdminEmails(feedbackDoc.agencyId);
    queueFeedbackResolvedEmail({
      feedback: normalized,
      update: updateEntry,
      fileBuffers: files,
      cc,
    });
  } else if (status === "reopened") {
    queueFeedbackReopenedEmail({
      feedback: normalized,
      update: updateEntry,
      fileBuffers: files,
    });
  }

  return normalized;
}

module.exports = {
  submit,
  list,
  statusCounts,
  getById,
  updateById,
  FEEDBACK_STATUSES,
};
