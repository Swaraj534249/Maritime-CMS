const User = require("../models/User");
const Agency = require("../models/Agency");
const bcrypt = require("bcryptjs");
const { sanitizeUser } = require("../utils/SanitizeUser");
const { sendMail } = require("../utils/Emails");
const { buildListQuery } = require("../utils/ListQueryBuilder");
const { buildListResponse } = require("../utils/ListResponseBuilder");

/**
 * Create a new agent
 */
exports.create = async (req, res) => {
  try {
    const { name, email, password, userType } = req.body;
    const agencyId = req.user.agencyId;

    // Fetch agency details
    const agency = await Agency.findById(agencyId);

    if (!agency) {
      return res.status(404).json({ message: "Agency not found" });
    }

    if (!agency.isActive) {
      return res.status(403).json({
        message: "Cannot create agent. Agency is inactive",
      });
    }

    // Check agent limit
    const currentAgentsCount = await User.countDocuments({
      agencyId: agency._id,
      role: "AGENT" || "AGENCY_ADMIN",
      isActive: true,
    });

    if (currentAgentsCount >= agency.maxAgents) {
      return res.status(403).json({
        message: `Agent limit reached. Maximum allowed: ${agency.maxAgents}`,
      });
    }

    // Validate email domain
    const emailDomain = email.split("@")[1].toLowerCase();
    
    if (!agency.isDomainAllowed(emailDomain)) {
      return res.status(400).json({
        message: `Email domain not allowed. Allowed domains: ${agency.allowedDomains.join(", ")}`,
      });
    }

    // Check if agent already exists
    const existingAgent = await User.findOne({ email });
    if (existingAgent) {
      return res.status(400).json({
        message: "User with this email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create agent
    const newAgent = new User({
      name,
      email,
      password: hashedPassword,
      role: "AGENT",
      agencyId: agency._id,
      userType,
      isVerified: false,
      createdBy: req.user._id,
    });

    await newAgent.save();

    // Send welcome email
    try {
      await sendMail(
        email,
        "Welcome to the Team",
        `<p>Hello ${name},</p>
        <p>Your agent account has been created by ${agency.name}.</p>
        <p><strong>Email:</strong> ${email}</p>
        <p>Please login and verify your email to get started.</p>
        <p>Best regards,<br>${agency.name}</p>`
      );
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
    }

    res.status(201).json(sanitizeUser(newAgent));
  } catch (error) {
    console.error("Create agent error:", error);
    res.status(500).json({
      message: "Error occurred while creating agent",
    });
  }
};

/**
 * List agents with pagination, search, and filtering
 */
exports.list = async (req, res) => {
  try {
    const {
      page,
      limit,
      searchValue,
      sortField,
      sortOrder,
      all,
      isActive,
    } = req.query;

    const pageNumber = Number(page || 1);
    const pageSizeNumber = Number(limit || 10);
    const agencyId = req.user.agencyId;

    // Fetch agency details for context
    let agencyContext = null;
    const agency = await Agency.findById(
      agencyId,
      "name allowedDomains maxAgents isActive"
    ).lean();
    
    if (agency) {
      agencyContext = {
        _id: agency._id,
        name: agency.name,
        allowedDomains: agency.allowedDomains || [],
        maxAgents: agency.maxAgents,
        isActive: agency.isActive,
      };
    }

    // Base filter for agents of this agency only
    const extraFilter = {
      agencyId,
      role: "AGENT",
    };

    // Add isActive filter if provided
    if (isActive === "true") {
      extraFilter.isActive = true;
    } else if (isActive === "false") {
      extraFilter.isActive = false;
    }

    const { queryFilter, skip, sort } = buildListQuery({
      Model: User,
      searchValue,
      searchFields: ["name", "email", "userType"],
      page: pageNumber,
      pageSize: pageSizeNumber,
      sortField,
      sortOrder,
      extraFilter,
    });

    // If 'all' is requested, return all records without pagination
    if (all === "true") {
      const data = await User.find(queryFilter)
        .select("-password")
        .populate("createdBy", "name email")
        .sort(sort)
        .lean();
      return res.json(data);
    }

    // Fetch paginated data and total count
    const [data, totalRecords] = await Promise.all([
      User.find(queryFilter)
        .select("-password")
        .populate("createdBy", "name email")
        .skip(skip)
        .limit(pageSizeNumber)
        .sort(sort)
        .lean(),
      User.countDocuments(queryFilter),
    ]);

    // Calculate aggregates
    const [activeCount, inactiveCount, verifiedCount] = await Promise.all([
      User.countDocuments({ ...extraFilter, isActive: true }),
      User.countDocuments({ ...extraFilter, isActive: false }),
      User.countDocuments({ ...extraFilter, isVerified: true }),
    ]);

    res.json(
      buildListResponse({
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
            verified: verifiedCount,
          },
        },
        context: {
          agency: agencyContext || null,
        },
      })
    );
  } catch (error) {
    console.error("List agents error:", error);
    res.status(500).json({ message: "Failed to fetch agents" });
  }
};

/**
 * Get agent by ID
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const agencyId = req.user.agencyId;

    const agent = await User.findOne({
      _id: id,
      agencyId,
      role: "AGENT",
    })
      .select("-password")
      .populate("createdBy", "name email");

    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    res.status(200).json(agent);
  } catch (error) {
    console.error("Get agent error:", error);
    res.status(500).json({ 
      message: "Error getting agent details, please try again later" 
    });
  }
};

/**
 * Update agent by ID
 */
exports.updateById = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const agencyId = req.user.agencyId;

    // Prevent updating critical fields
    delete updates._id;
    delete updates.email;
    delete updates.password;
    delete updates.role;
    delete updates.agencyId;
    delete updates.createdBy;

    const agent = await User.findOneAndUpdate(
      { _id: id, agencyId, role: "AGENT" },
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    res.status(200).json(agent);
  } catch (error) {
    console.error("Update agent error:", error);
    res.status(500).json({ 
      message: "Error updating agent, please try again later" 
    });
  }
};

/**
 * Toggle agent status (active/inactive)
 */
exports.toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const agencyId = req.user.agencyId;

    const agent = await User.findOne({
      _id: id,
      agencyId,
      role: "AGENT",
    });

    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    agent.isActive = !agent.isActive;
    await agent.save();

    res.json(agent);
  } catch (error) {
    console.error("Toggle agent status error:", error);
    res.status(500).json({ 
      message: "Error updating agent status, please try again later" 
    });
  }
};

/**
 * Reset agent password
 */
exports.resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    const agencyId = req.user.agencyId;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const agent = await User.findOneAndUpdate(
      { _id: id, agencyId, role: "AGENT" },
      { password: hashedPassword },
      { new: true }
    ).select("-password");

    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    // Send email notification
    try {
      await sendMail(
        agent.email,
        "Password Reset",
        `<p>Hello ${agent.name},</p>
        <p>Your password has been reset by an administrator.</p>
        <p>Please login with your new password and change it immediately.</p>`
      );
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
    }

    res.status(200).json({
      message: "Agent password reset successfully",
    });
  } catch (error) {
    console.error("Reset agent password error:", error);
    res.status(500).json({ message: "Error resetting agent password" });
  }
};