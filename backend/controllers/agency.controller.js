const Agency = require("../models/Agency");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { sanitizeUser } = require("../utils/SanitizeUser");
const { buildListQuery } = require("../utils/ListQueryBuilder");
const { buildListResponse } = require("../utils/ListResponseBuilder");
const { sendMail } = require("../utils/Emails");

exports.create = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      contactPerson, 
      phone, 
      address, 
      licenseNumber, 
      subscriptionPlan, 
      maxAgents, 
      password, 
      industryType
    } = req.body;

    if (!name || !email || !contactPerson || !phone || !password) {
      return res.status(400).json({
        message: "Name, email, contact person, phone, and password are required",
      });
    }

    if (!industryType) {
      return res.status(400).json({
        message: "Industry type is required. Please select from dropdown.",
      });
    }

    const allowedIndustries = ["maritime", "healthcare", "construction", "hospitality", "other"];
    if (!allowedIndustries.includes(industryType)) {
      return res.status(400).json({
        message: `Invalid industry type. Allowed values: ${allowedIndustries.join(", ")}`,
      });
    }

    const existingAgency = await Agency.findOne({ email });
    if (existingAgency) {
      return res.status(400).json({
        message: "Agency with this email already exists",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "User with this email already exists",
      });
    }

    // Create agency
    const newAgency = new Agency({
      name,
      email,
      contactPerson,
      phone,
      address,
      licenseNumber,
      industryType,
      subscriptionPlan: subscriptionPlan || "basic",
      maxAgents: maxAgents || 5,
    });
    await newAgency.save();

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const adminUserData = {
      name: contactPerson,
      email,
      password: hashedPassword,
      role: "AGENCY_ADMIN",
      agencyId: newAgency._id,
      industryType,
      userType: "manager",
      isVerified: false,
    };

    if (req.user && req.user._id) {
      adminUserData.createdBy = req.user._id;
    }

    const adminUser = new User(adminUserData);
    await adminUser.save();

    try {
      const loginUrl = `${process.env.ORIGIN}/login`;
      
      await sendMail(
        email,
        "Welcome - Your Agency Admin Account Details",
        `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Our Platform!</h2>
          
          <p>Hello ${contactPerson},</p>
          
          <p>Your agency <strong>${name}</strong> has been successfully registered, and your admin account has been created.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Agency Details:</h3>
            <p style="margin: 10px 0;"><strong>Agency Name:</strong> ${name}</p>
            <p style="margin: 10px 0;"><strong>Industry Type:</strong> ${industryType}</p>
            <p style="margin: 10px 0;"><strong>User Role:</strong> Manager</p>
            <p style="margin: 10px 0;"><strong>Subscription Plan:</strong> ${subscriptionPlan || "basic"}</p>
            <p style="margin: 10px 0;"><strong>Max Agents Allowed:</strong> ${maxAgents || 5}</p>
          </div>
          
          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Your Admin Login Credentials:</h3>
            <p style="margin: 10px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 10px 0;"><strong>Password:</strong> ${password}</p>
            <p style="margin: 10px 0;"><strong>Login URL:</strong> <a href="${loginUrl}" style="color: #007bff;">${loginUrl}</a></p>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
            <p style="margin: 0;"><strong>⚠️ Next Steps:</strong></p>
            <ol style="margin: 10px 0; padding-left: 20px;">
              <li>Click the login link above or copy it to your browser</li>
              <li>Login using your email and password</li>
              <li>You'll be asked to verify your email with an OTP</li>
              <li>After verification, you can create and manage agents</li>
              <li>You can change your password anytime in your profile</li>
            </ol>
          </div>
          
          <div style="background-color: #d4edda; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;">
            <p style="margin: 0;"><strong>✨ What You Can Do:</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Create and manage up to ${maxAgents || 5} agents</li>
              <li>Monitor your agents' activities</li>
              <li>Manage agency settings and preferences</li>
            </ul>
          </div>
          
          <p>If you have any questions or need assistance, please contact our support team.</p>
          
          <p style="margin-top: 30px;">Best regards,<br><strong>Platform Administration Team</strong></p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #888; font-size: 12px;">This is an automated email. Please do not reply to this message.</p>
        </div>`
      );
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
    }

    res.status(201).json({
      agency: newAgency,
      admin: sanitizeUser(adminUser),
    });
  } catch (error) {
    console.error("Create agency error:", error);
    res.status(500).json({
      message: error.message || "Error occurred while creating agency",
      error: process.env.NODE_ENV === "development" ? error.toString() : undefined,
    });
  }
};

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
      industryType,
    } = req.query;

    const pageNumber = Number(page || 1);
    const pageSizeNumber = Number(limit || 10);
    
    // Base filter
    const extraFilter = {};

    if (isActive === "true") {
      extraFilter.isActive = true;
    } else if (isActive === "false") {
      extraFilter.isActive = false;
    }

    if (industryType) {
      extraFilter.industryType = industryType;
    }

    const { queryFilter, skip, sort } = buildListQuery({
      Model: Agency,
      searchValue,
      searchFields: ["name", "email", "contactPerson"],
      page: pageNumber,
      pageSize: pageSizeNumber,
      sortField,
      sortOrder,
      extraFilter,
    });

    if (all === "true") {
      const data = await Agency.find(queryFilter).sort(sort).lean();
      return res.json(data);
    }

    const [data, totalRecords] = await Promise.all([
      Agency.find(queryFilter)
        .skip(skip)
        .limit(pageSizeNumber)
        .sort(sort)
        .lean(),
      Agency.countDocuments(queryFilter),
    ]);

    const agencyIds = data.map((a) => a._id);

    const admins = await User.find({
      agencyId: { $in: agencyIds },
      role: "AGENCY_ADMIN",
    })
      .select("_id name email agencyId createdBy")
      .populate("createdBy", "name email")
      .lean();

    const agentCounts = await User.aggregate([
      {
        $match: {
          agencyId: { $in: agencyIds },
          role: { $in: ["AGENT", "AGENCY_ADMIN"] },
          isActive: true,
        },
      },
      { $group: { _id: "$agencyId", count: { $sum: 1 } } },
    ]);

    const agentCountByAgency = {};
    agentCounts.forEach((ac) => {
      if (ac._id) {
        agentCountByAgency[ac._id.toString()] = ac.count;
      }
    });

    const adminByAgency = {};
    admins.forEach((admin) => {
      if (admin.agencyId) {
        adminByAgency[admin.agencyId.toString()] = admin;
      }
    });

    const enhancedData = data.map((agency) => ({
      ...agency,
      agentCount: agentCountByAgency[agency._id.toString()] || 0,
      admin: adminByAgency[agency._id.toString()] || null,
    }));

    const [activeCount, inactiveCount, industryGroups] = await Promise.all([
      Agency.countDocuments({ ...extraFilter, isActive: true }),
      Agency.countDocuments({ ...extraFilter, isActive: false }),
      Agency.aggregate([
        { $match: extraFilter },
        { $group: { _id: "$industryType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    res.json(
      buildListResponse({
        data: enhancedData,
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
          },
          byIndustry: industryGroups,
        },
        context: {},
      })
    );
  } catch (error) {
    console.error("List agencies error:", error);
    res.status(500).json({ message: "Failed to fetch agencies" });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const agency = await Agency.findById(id);

    if (!agency) {
      return res.status(404).json({ message: "Agency not found" });
    }

    const admin = await User.findOne({
      agencyId: agency._id,
      role: "AGENCY_ADMIN",
    })
      .select("-password")
      .populate("name email");

    const agentsCount = await User.countDocuments({
      agencyId: agency._id,
      role: "AGENT",
      isActive: true,
    });

    res.status(200).json({
      ...agency.toObject(),
      admin: admin || null,
      agentsCount,
    });
  } catch (error) {
    console.error("Get agency error:", error);
    res.status(500).json({
      message: "Error getting agency details, please try again later",
    });
  }
};

exports.updateById = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    delete updates._id;
    delete updates.email;

    const passwordUpdate = updates.password;
    delete updates.password;

    const industryTypeChanged = updates.industryType && updates.industryType !== undefined;
    const newIndustryType = updates.industryType;

    const updatedAgency = await Agency.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedAgency) {
      return res.status(404).json({ message: "Agency not found" });
    }

    if (industryTypeChanged) {
      await User.updateMany(
        { agencyId: id },
        { $set: { industryType: newIndustryType } }
      );
    }

    if (passwordUpdate) {
      const hashedPassword = await bcrypt.hash(passwordUpdate, 10);
      const admin = await User.findOneAndUpdate(
        { agencyId: id, role: "AGENCY_ADMIN" },
        { password: hashedPassword },
        { new: true }
      ).select("-password");

      if (admin) {
        try {
          const loginUrl = `${process.env.ORIGIN}/login`;
          
          await sendMail(
            admin.email,
            "Password Updated - Agency Admin Account",
            `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Password Updated</h2>
              
              <p>Hello ${admin.name},</p>
              
              <p>Your agency admin password has been updated by a super administrator.</p>
              
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 10px 0;"><strong>New Password:</strong> ${passwordUpdate}</p>
                <p style="margin: 10px 0;"><strong>Login URL:</strong> <a href="${loginUrl}" style="color: #007bff;">${loginUrl}</a></p>
              </div>
              
              <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
                <p style="margin: 0;"><strong>⚠️ Security Reminder:</strong> Please login and change your password in your profile for security purposes.</p>
              </div>
              
              <p>If you did not request this password reset, please contact support immediately.</p>
              
              <p style="margin-top: 30px;">Best regards,<br>Platform Administration Team</p>
            </div>`
          );
          // console.log("Password update email sent successfully to:", admin.email);
        } catch (emailError) {
          console.error("Email sending failed:", emailError);
        }
      }
    }

    // Get updated admin details
    const admin = await User.findOne({
      agencyId: updatedAgency._id,
      role: "AGENCY_ADMIN",
    }).select("-password");

    res.status(200).json({
      agency: updatedAgency,
      admin,
    });
  } catch (error) {
    console.error("Update agency error:", error);
    res.status(500).json({
      message: error.message || "Error updating agency, please try again later",
    });
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const agency = await Agency.findById(id);

    if (!agency) {
      return res.status(404).json({ message: "Agency not found" });
    }

    agency.isActive = !agency.isActive;
    await agency.save();

    await User.updateMany({ agencyId: agency._id }, { isActive: agency.isActive });

    res.json(agency);
  } catch (error) {
    console.error("Toggle agency status error:", error);
    res.status(500).json({
      message: "Error updating agency status, please try again later",
    });
  }
};

exports.bulkImport = async (req, res) => {
  res.json({ message: "Bulk import coming soon" });
};

exports.exportList = async (req, res) => {
  res.json({ message: "Export coming soon" });
};