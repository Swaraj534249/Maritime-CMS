const Agency = require("../models/Agency");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { sanitizeUser } = require("../utils/SanitizeUser");
const { buildListQuery } = require("../utils/ListQueryBuilder");
const { buildListResponse } = require("../utils/ListResponseBuilder");

exports.create = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { agency, admin } = req.body;

    if (!agency || !admin) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: "Agency and admin details are required",
      });
    }

    const existingAgency = await Agency.findOne({ email: agency.email });
    if (existingAgency) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: "Agency with this email already exists",
      });
    }

    const existingAdmin = await User.findOne({ email: admin.email });
    if (existingAdmin) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: "User with this email already exists",
      });
    }

    const agencyEmailDomain = agency.email.split("@")[1].toLowerCase();
    const adminEmailDomain = admin.email.split("@")[1].toLowerCase();
    const allowedDomains = agency.allowedDomains.map((d) => d.toLowerCase());

    if (!allowedDomains.includes(adminEmailDomain) && !allowedDomains.includes(agencyEmailDomain)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: `Admin email domain must be one of: ${agency.allowedDomains.join(", ")}`,
      });
    }

    const newAgency = new Agency(agency);
    await newAgency.save({ session });

    // Hash password
    const hashedPassword = await bcrypt.hash(admin.password, 10);

    const adminUserData = {
      name: admin.name,
      email: admin.email,
      password: hashedPassword,
      role: "AGENCY_ADMIN",
      agencyId: newAgency._id,
      userType: admin.userType || null,
      isVerified: false,
    };

    if (req.user && req.user._id) {
      adminUserData.createdBy = req.user._id;
    }

    const adminUser = new User(adminUserData);
    await adminUser.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      agency: newAgency,
      admin: sanitizeUser(adminUser),
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
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
    } = req.query;

    const pageNumber = Number(page || 1);
    const pageSizeNumber = Number(limit || 10);

    console.log("list agency");
    
    // Base filter
    const extraFilter = {};

    // Add isActive filter if provided
    if (isActive === "true") {
      extraFilter.isActive = true;
    } else if (isActive === "false") {
      extraFilter.isActive = false;
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

    // If 'all' is requested, return all records without pagination
    if (all === "true") {
      const data = await Agency.find(queryFilter).sort(sort).lean();
      return res.json(data);
    }

    // Fetch paginated data and total count
    const [data, totalRecords] = await Promise.all([
      Agency.find(queryFilter)
        .skip(skip)
        .limit(pageSizeNumber)
        .sort(sort)
        .lean(),
      Agency.countDocuments(queryFilter),
    ]);

    // For each agency, get the admin count and admin details
    const agencyIds = data.map((a) => a._id);

    // Get admin details for each agency
    const admins = await User.find({
      agencyId: { $in: agencyIds },
      role: "AGENCY_ADMIN",
    })
      .select("_id name email agencyId createdBy")
      .populate("createdBy", "name email")
      .lean();

    // Get agent counts for each agency
    const agentCounts = await User.aggregate([
      {
        $match: {
          agencyId: { $in: agencyIds },
          role: "AGENT",
          isActive: true,
        },
      },
      { $group: { _id: "$agencyId", count: { $sum: 1 } } },
    ]);

    // Create lookup maps
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

    // Enhance data with counts and admin info
    const enhancedData = data.map((agency) => ({
      ...agency,
      agentCount: agentCountByAgency[agency._id.toString()] || 0,
      admin: adminByAgency[agency._id.toString()] || null,
    }));

    // Calculate aggregates
    const [activeCount, inactiveCount] = await Promise.all([
      Agency.countDocuments({ ...extraFilter, isActive: true }),
      Agency.countDocuments({ ...extraFilter, isActive: false }),
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

    // Get admin details
    const admin = await User.findOne({
      agencyId: agency._id,
      role: "AGENCY_ADMIN",
    })
      .select("-password")
      .populate("name email");

    // Get agents count
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
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { agency, admin } = req.body;

    const updatedAgency = await Agency.findByIdAndUpdate(
      id,
      { $set: agency },
      { new: true, runValidators: true, session }
    );

    if (!updatedAgency) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Agency not found" });
    }

    // Update admin if provided
    let updatedAdmin = null;
    if (admin && admin._id) {
      const adminUpdates = { ...admin };
      delete adminUpdates._id;
      delete adminUpdates.email;
      delete adminUpdates.role;
      delete adminUpdates.agencyId;

      if (adminUpdates.password) {
        adminUpdates.password = await bcrypt.hash(adminUpdates.password, 10);
      } else {
        delete adminUpdates.password;
      }

      updatedAdmin = await User.findByIdAndUpdate(
        admin._id,
        { $set: adminUpdates },
        { new: true, session }
      ).select("-password");
    }

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      agency: updatedAgency,
      admin: updatedAdmin,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

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

    // Optionally toggle all users of this agency
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