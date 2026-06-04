const bcrypt = require("bcryptjs");
const User = require("../../models/User");
const Agency = require("../../models/Agency");
const { AppError } = require("../../errors/AppError");
const { sanitizeUser } = require("../../utils/SanitizeUser");
const { buildListQuery } = require("../../utils/ListQueryBuilder");
const { buildListResponse } = require("../../utils/ListResponseBuilder");
const {
  prepareAndQueueAgentWelcome,
  queueAdminPasswordChangedNotice,
} = require("../email/emailNotification.service");
const { hashPlaceholderPassword } = require("../../utils/placeholderPassword");
const { STATUS } = require("../../utils/userStatus");

function resolveTargetAgencyId(req, bodyAgencyId) {
  const userRole = req.user.role;
  if (userRole === "SUPER_ADMIN") {
    if (!bodyAgencyId) {
      throw new AppError(400, "Agency ID is required for super admin");
    }
    return bodyAgencyId;
  }
  if (userRole === "AGENCY_ADMIN") {
    if (!req.user.agencyId) {
      throw new AppError(400, "Agency ID not found for user");
    }
    return req.user.agencyId;
  }
  throw new AppError(403, "Insufficient permissions to create agents");
}

async function create(req) {
  const { name, email, userType, agencyId: bodyAgencyId } = req.body;
  const targetAgencyId = resolveTargetAgencyId(req, bodyAgencyId);

  const agency = await Agency.findById(targetAgencyId);
  if (!agency) {
    throw new AppError(404, "Agency not found");
  }
  if (!agency.isActive) {
    throw new AppError(403, "Cannot create agent. Agency is inactive");
  }

  const currentAgentsCount = await User.countDocuments({
    agencyId: agency._id,
    role: { $in: ["AGENT", "AGENCY_ADMIN"] },
    status: { $ne: STATUS.INACTIVE },
  });
  if (currentAgentsCount >= agency.maxAgents) {
    throw new AppError(
      403,
      `Agent limit reached. Maximum allowed: ${agency.maxAgents}`,
    );
  }

  const existingAgent = await User.findOne({
    email,
    agencyId: agency._id,
    role: { $in: ["AGENT", "AGENCY_ADMIN"] },
  });
  if (existingAgent) {
    throw new AppError(400, "An agent with this email already exists in your agency");
  }

  const newAgent = new User({
    name,
    email,
    password: await hashPlaceholderPassword(),
    role: "AGENT",
    agencyId: agency._id,
    industryType: agency.industryType,
    userType,
    status: STATUS.UNVERIFIED,
    createdBy: req.user._id,
  });
  await newAgent.save();

  try {
    await prepareAndQueueAgentWelcome({
      user: newAgent,
      agencyName: agency.name,
    });
  } catch (emailError) {
    console.error("Welcome email queue failed:", emailError);
  }

  return sanitizeUser(newAgent);
}

async function list(req) {
  const {
    page,
    limit,
    searchValue,
    sortField,
    sortOrder,
    all,
    status: statusFilter,
    agencyId: queryAgencyId,
    industryType,
  } = req.query;

  const pageNumber = Number(page || 1);
  const pageSizeNumber = Number(limit || 10);
  const userRole = req.user.role;
  const userAgencyId = req.user.agencyId;
  const userIndustryType = req.user.industryType;

  let targetAgencyId;
  if (userRole === "SUPER_ADMIN") {
    targetAgencyId = queryAgencyId || null;
  } else if (userRole === "AGENCY_ADMIN") {
    targetAgencyId = userAgencyId;
    if (!targetAgencyId) {
      throw new AppError(400, "Agency ID not found for user");
    }
  } else {
    throw new AppError(403, "Insufficient permissions");
  }

  const extraFilter = { role: { $in: ["AGENT", "AGENCY_ADMIN"] } };
  if (targetAgencyId) extraFilter.agencyId = targetAgencyId;
  if (statusFilter === STATUS.ACTIVE) extraFilter.status = STATUS.ACTIVE;
  else if (statusFilter === STATUS.INACTIVE) extraFilter.status = STATUS.INACTIVE;
  else if (statusFilter === STATUS.UNVERIFIED) {
    extraFilter.status = STATUS.UNVERIFIED;
  } else if (statusFilter === STATUS.VERIFIED) {
    extraFilter.status = STATUS.VERIFIED;
  }
  if (industryType) extraFilter.industryType = industryType;
  else if (userRole !== "SUPER_ADMIN" && userIndustryType) {
    extraFilter.industryType = userIndustryType;
  }

  let agencyContext = null;
  if (targetAgencyId) {
    const agency = await Agency.findById(
      targetAgencyId,
      "name maxAgents isActive industryType",
    ).lean();
    if (agency) {
      agencyContext = {
        _id: agency._id,
        name: agency.name,
        maxAgents: agency.maxAgents,
        isActive: agency.isActive,
        industryType: agency.industryType,
      };
    }
  }

  const { queryFilter, skip, sort } = buildListQuery({
    searchValue,
    searchFields: ["name", "email", "userType"],
    page: pageNumber,
    pageSize: pageSizeNumber,
    sortField,
    sortOrder,
    extraFilter,
  });

  if (all === "true") {
    return User.find(queryFilter)
      .select("-password")
      .populate("createdBy", "name email")
      .populate("agencyId", "name email industryType")
      .sort(sort)
      .lean();
  }

  const [data, totalRecords] = await Promise.all([
    User.find(queryFilter)
      .select("-password")
      .populate("createdBy", "name email")
      .populate("agencyId", "name email industryType")
      .skip(skip)
      .limit(pageSizeNumber)
      .sort(sort)
      .lean(),
    User.countDocuments(queryFilter),
  ]);

  const [activeCount, inactiveCount, unverifiedCount, verifiedCount] =
    await Promise.all([
      User.countDocuments({ ...extraFilter, status: STATUS.ACTIVE }),
      User.countDocuments({ ...extraFilter, status: STATUS.INACTIVE }),
      User.countDocuments({ ...extraFilter, status: STATUS.UNVERIFIED }),
      User.countDocuments({ ...extraFilter, status: STATUS.VERIFIED }),
    ]);

  let agencyGroups = null;
  if (userRole === "SUPER_ADMIN" && !targetAgencyId) {
    agencyGroups = await User.aggregate([
      { $match: extraFilter },
      { $group: { _id: "$agencyId", count: { $sum: 1 } } },
      {
        $lookup: {
          from: "agencies",
          localField: "_id",
          foreignField: "_id",
          as: "agency",
        },
      },
      { $unwind: "$agency" },
      {
        $project: {
          agencyId: "$_id",
          agencyName: "$agency.name",
          agentCount: "$count",
          maxAgents: "$agency.maxAgents",
          isActive: "$agency.isActive",
          industryType: "$agency.industryType",
        },
      },
    ]);
  }

  return buildListResponse({
    data,
    page: pageNumber,
    pageSize: pageSizeNumber,
    totalRecords,
    searchValue,
    sortField,
    sortOrder,
    aggregates: {
      counts: {
        total: totalRecords,
        active: activeCount,
        inactive: inactiveCount,
        unverified: unverifiedCount,
        verified: verifiedCount,
      },
      agencyGroups,
    },
    context: {
      agency: agencyContext,
      viewMode: userRole === "SUPER_ADMIN" ? "super-admin" : "agency-admin",
    },
  });
}

async function getById(req) {
  const { id } = req.params;
  const userRole = req.user.role;
  const userAgencyId = req.user.agencyId;
  const query = { _id: id, role: { $in: ["AGENT", "AGENCY_ADMIN"] } };
  if (userRole === "AGENCY_ADMIN") query.agencyId = userAgencyId;

  const agent = await User.findOne(query)
    .select("-password")
    .populate("createdBy", "name email")
    .populate("agencyId", "name email industryType");
  if (!agent) throw new AppError(404, "Agent not found");
  return agent;
}

const ADMIN_AGENT_FIELDS = ["name", "userType"];

async function updateById(req) {
  const { id } = req.params;
  const updates = {};
  for (const key of ADMIN_AGENT_FIELDS) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  const userRole = req.user.role;
  const userAgencyId = req.user.agencyId;

  const query = { _id: id, role: { $in: ["AGENT", "AGENCY_ADMIN"] } };
  if (userRole === "AGENCY_ADMIN") query.agencyId = userAgencyId;

  const agent = await User.findOneAndUpdate(
    query,
    { $set: updates },
    { new: true, runValidators: true },
  )
    .select("-password")
    .populate("agencyId", "name email industryType");
  if (!agent) throw new AppError(404, "Agent not found");
  return agent;
}

async function toggleStatus(req) {
  const { id } = req.params;
  const userRole = req.user.role;
  const userAgencyId = req.user.agencyId;
  const query = { _id: id, role: { $in: ["AGENT", "AGENCY_ADMIN"] } };
  if (userRole === "AGENCY_ADMIN") query.agencyId = userAgencyId;

  const agent = await User.findOne(query);
  if (!agent) throw new AppError(404, "Agent not found");

  if (
    agent.status === STATUS.UNVERIFIED ||
    agent.status === STATUS.VERIFIED
  ) {
    throw new AppError(
      400,
      "Cannot change status until the agent has completed profile setup",
    );
  }

  if (agent.status === STATUS.ACTIVE) {
    agent.status = STATUS.INACTIVE;
  } else if (agent.status === STATUS.INACTIVE) {
    agent.status = STATUS.ACTIVE;
  }
  await agent.save();

  return User.findById(agent._id)
    .select("-password")
    .populate("agencyId", "name email industryType");
}

async function resetPassword(req) {
  const { id } = req.params;
  const { newPassword } = req.body;
  const userRole = req.user.role;
  const userAgencyId = req.user.agencyId;

  if (!newPassword || newPassword.length < 6) {
    throw new AppError(400, "Password must be at least 6 characters long");
  }

  const query = { _id: id, role: { $in: ["AGENT", "AGENCY_ADMIN"] } };
  if (userRole === "AGENCY_ADMIN") query.agencyId = userAgencyId;

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const existing = await User.findOne(query);
  if (!existing) throw new AppError(404, "Agent not found");

  let nextStatus = existing.status;
  if (existing.status === STATUS.UNVERIFIED) {
    nextStatus = STATUS.VERIFIED;
  } else if (existing.status === STATUS.INACTIVE) {
    nextStatus = STATUS.INACTIVE;
  } else if (existing.status === STATUS.ACTIVE) {
    nextStatus = STATUS.ACTIVE;
  }

  const agent = await User.findOneAndUpdate(
    query,
    { password: hashedPassword, status: nextStatus },
    { new: true },
  )
    .select("-password")
    .populate("agencyId", "name email industryType");

  if (!agent) throw new AppError(404, "Agent not found");

  try {
    queueAdminPasswordChangedNotice({ email: agent.email, name: agent.name });
  } catch (emailError) {
    console.error("Password notice email queue failed:", emailError);
  }

  return { message: "Agent password reset successfully" };
}

module.exports = {
  create,
  list,
  getById,
  updateById,
  toggleStatus,
  resetPassword,
};
