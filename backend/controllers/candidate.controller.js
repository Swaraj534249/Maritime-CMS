const Candidate = require("../models/Candidate");
const Agency = require("../models/Agency");
const User = require("..//models/User");
const { deleteFile } = require("../middleware/upload");
const { buildListQuery } = require("../utils/ListQueryBuilder");
const { buildListResponse } = require("../utils/ListResponseBuilder");
const resumeParser = require("../utils/ResumeParser");
const fs = require("fs");

exports.parseResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: "Resume file is required" 
      });
    }

    const file = req.file;
    const buffer = fs.readFileSync(file.path);

    // Parse the resume
    const parsedData = await resumeParser.parseResume(buffer, file.mimetype);

    // Clean up uploaded file (we don't need to keep it on server yet)
    fs.unlinkSync(file.path);

    res.json({
      success: true,
      data: parsedData,
      message: "Resume parsed successfully"
    });
  } catch (error) {
    console.error("Resume parsing error:", error);
    
    // Clean up file on error
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    
    res.status(500).json({
      success: false,
      message: "Failed to parse resume. Please fill the form manually.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.create = async (req, res) => {
  try {
    const data = { ...req.body };
    const userRole = req.user.role;
    const userAgencyId = req.user.agencyId;

    // Determine target agency
    let targetAgencyId;
    if (userRole === "SUPER_ADMIN") {
      targetAgencyId = data.agencyId;
      if (!targetAgencyId) {
        return res.status(400).json({
          message: "Agency ID is required for super admin",
        });
      }
    } else {
      targetAgencyId = userAgencyId;
      data.agencyId = targetAgencyId;
    }

    // Verify agency exists and is active
    const agency = await Agency.findById(targetAgencyId);
    if (!agency) {
      return res.status(404).json({ message: "Agency not found" });
    }

    if (!agency.isActive) {
      return res.status(403).json({
        message: "Cannot add candidate. Agency is inactive",
      });
    }

    // Set industryType from agency
    data.industryType = agency.industryType;

    // Set addedBy
    data.addedBy = req.user._id;

    // Check for duplicate email OR indosNumber within agency
    const duplicateQuery = {
      agencyId: targetAgencyId,
      $or: [],
    };

    if (data.email) {
      duplicateQuery.$or.push({ email: data.email });
    }

    if (data.indosNumber) {
      duplicateQuery.$or.push({ indosNumber: data.indosNumber });
    }

    if (duplicateQuery.$or.length > 0) {
      const existingCandidate = await Candidate.findOne(duplicateQuery);

      if (existingCandidate) {
        if (
          existingCandidate.email === data.email &&
          existingCandidate.indosNumber === data.indosNumber
        ) {
          return res.status(400).json({
            message:
              "Candidate with this email and INDOS number already exists in your agency",
          });
        } else if (existingCandidate.email === data.email) {
          return res.status(400).json({
            message: "Candidate with this email already exists in your agency",
          });
        } else {
          return res.status(400).json({
            message:
              "Candidate with this INDOS number already exists in your agency",
          });
        }
      }
    }

    // Process uploaded files
    if (req.files) {
      data.documents = processUploadedFiles(req.files);
    }

    const candidate = new Candidate(data);
    await candidate.save();

    // Populate before sending response
    await candidate.populate([
      { path: "agencyId", select: "name email industryType" },
      { path: "addedBy", select: "name email" },
    ]);

    res.status(201).json(candidate);
  } catch (error) {
    console.error("Create candidate error:", error);
    cleanupFiles(req.files);
    res.status(500).json({
      message: "Error adding candidate, please try again later",
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
      isDeleted,
      currentStatus,
      rank,
      agencyId: queryAgencyId,
      addedBy,
    } = req.query;

    const pageNumber = Number(page || 1);
    const pageSizeNumber = Number(limit || 10);
    const userRole = req.user.role;
    const userAgencyId = req.user.agencyId;

    // Determine which agency to filter by
    let targetAgencyId;
    if (userRole === "SUPER_ADMIN") {
      targetAgencyId = queryAgencyId || null;
    } else {
      targetAgencyId = userAgencyId;
      if (!targetAgencyId) {
        return res.status(400).json({
          message: "Agency ID not found for user",
        });
      }
    }

    // Build base filter
    const extraFilter = {};

    if (targetAgencyId) {
      extraFilter.agencyId = targetAgencyId;
    }

    // Active filter
    if (isActive === "true") {
      extraFilter.isActive = true;
    } else if (isActive === "false") {
      extraFilter.isActive = false;
    }

    // Status filter
    if (currentStatus) {
      extraFilter.currentStatus = currentStatus;
    }

    // Rank filter
    if (rank) {
      extraFilter.rank = rank;
    }

    // AddedBy filter (for agents to see only their candidates)
    if (addedBy) {
      extraFilter.addedBy = addedBy;
    }

    const { queryFilter, skip, sort } = buildListQuery({
      Model: Candidate,
      searchValue,
      searchFields: [
        "firstName",
        "lastName",
        "email",
        "phone",
        "passportNumber",
        "cdcNumber",
        "indosNumber",
        "rank",
      ],
      page: pageNumber,
      pageSize: pageSizeNumber,
      sortField,
      sortOrder,
      extraFilter,
    });

    if (all === "true") {
      const data = await Candidate.find(queryFilter)
        .populate("agencyId", "name email industryType")
        .populate("addedBy", "name email")
        .sort(sort)
        .lean();
      return res.json(data);
    }

    const [data, totalRecords] = await Promise.all([
      Candidate.find(queryFilter)
        .populate("agencyId", "name email industryType")
        .populate("addedBy", "name email")
        .skip(skip)
        .limit(pageSizeNumber)
        .sort(sort)
        .lean(),
      Candidate.countDocuments(queryFilter),
    ]);

    // Calculate aggregates
    const [
      activeCount,
      inactiveCount,
      availableCount,
      onboardCount,
      statusGroups,
      rankGroups,
    ] = await Promise.all([
      Candidate.countDocuments({ ...extraFilter, isActive: true }),
      Candidate.countDocuments({ ...extraFilter, isActive: false }),
      Candidate.countDocuments({ ...extraFilter, currentStatus: "Available" }),
      Candidate.countDocuments({ ...extraFilter, currentStatus: "Onboard" }),
      Candidate.aggregate([
        { $match: extraFilter },
        { $group: { _id: "$currentStatus", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Candidate.aggregate([
        { $match: extraFilter },
        { $group: { _id: "$rank", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    // Get agency context if applicable
    let agencyContext = null;
    if (targetAgencyId) {
      const agency = await Agency.findById(
        targetAgencyId,
        "name industryType isActive",
      ).lean();
      if (agency) {
        agencyContext = agency;
      }
    }

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
            available: availableCount,
            onboard: onboardCount,
          },
          byStatus: statusGroups,
          byRank: rankGroups,
        },
        context: {
          agency: agencyContext,
          viewMode: userRole === "SUPER_ADMIN" ? "super-admin" : "agency",
        },
      }),
    );
  } catch (error) {
    console.error("List candidates error:", error);
    res.status(500).json({ message: "Failed to fetch candidates" });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;
    const userAgencyId = req.user.agencyId;

    const query = { _id: id };

    if (userRole !== "SUPER_ADMIN") {
      query.agencyId = userAgencyId;
    }

    const candidate = await Candidate.findOne(query)
      .populate("agencyId", "name email industryType")
      .populate("addedBy", "name email");

    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    res.status(200).json(candidate);
  } catch (error) {
    console.error("Get candidate error:", error);
    res.status(500).json({
      message: "Error getting candidate details, please try again later",
    });
  }
};

exports.updateById = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    const userRole = req.user.role;
    const userAgencyId = req.user.agencyId;

    // Prevent updating critical fields
    delete updates._id;
    delete updates.agencyId;
    delete updates.addedBy;
    delete updates.industryType;
    delete updates.createdAt;

    // Build query based on role
    const query = { _id: id };
    if (userRole !== "SUPER_ADMIN") {
      query.agencyId = userAgencyId;
    }

    const existing = await Candidate.findOne(query);
    if (!existing) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    // Process uploaded files
    if (req.files) {
      const uploadedFiles = processUploadedFiles(req.files, existing.documents);

      // Initialize documents object if it doesn't exist
      if (!updates.documents) {
        updates.documents = {};
      }

      // Merge with existing documents, replacing old files
      if (uploadedFiles.photo) {
        if (existing.documents?.photo?.path) {
          deleteFile(existing.documents.photo.path);
        }
        updates.documents.photo = uploadedFiles.photo;
      }

      // Handle documents with main/old structure
      [
        "passport",
        "cdc",
        "indos",
        "visa",
        "medicalCertificate",
        "seamanBook",
        "resume",
      ].forEach((docType) => {
        if (uploadedFiles[docType]) {
          if (existing.documents?.[docType]?.old?.path) {
            deleteFile(existing.documents[docType].old.path);
          }
          updates.documents[docType] = uploadedFiles[docType];
        }
      });

      // Handle single documents
      ["aadhar", "pan"].forEach((docType) => {
        if (uploadedFiles[docType]) {
          if (existing.documents?.[docType]?.path) {
            deleteFile(existing.documents[docType].path);
          }
          updates.documents[docType] = uploadedFiles[docType];
        }
      });
    }

    const candidate = await Candidate.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    })
      .populate("agencyId", "name email industryType")
      .populate("addedBy", "name email");

    res.status(200).json(candidate);
  } catch (error) {
    console.error("Update candidate error:", error);
    cleanupFiles(req.files);
    res.status(500).json({
      message: "Error updating candidate, please try again later",
    });
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;
    const userAgencyId = req.user.agencyId;

    const query = { _id: id };
    if (userRole !== "SUPER_ADMIN") {
      query.agencyId = userAgencyId;
    }

    const candidate = await Candidate.findOne(query);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    // Toggle isActive status
    candidate.isActive = !candidate.isActive;

    // Update currentStatus based on isActive
    if (!candidate.isActive) {
      // Deactivating: set status to "Not Available"
      candidate.currentStatus = "Not Available";
    } else {
      // Activating: set status to "Available"
      candidate.currentStatus = "Available";
    }

    await candidate.save();

    await candidate.populate([
      { path: "agencyId", select: "name email industryType" },
      { path: "addedBy", select: "name email" },
    ]);

    res.json(candidate);
  } catch (error) {
    console.error("Toggle candidate status error:", error);
    res.status(500).json({
      message: "Error updating candidate status, please try again later",
    });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentStatus, availableFrom, joinDate } = req.body;
    const userRole = req.user.role;
    const userAgencyId = req.user.agencyId;

    if (!currentStatus) {
      return res.status(400).json({ message: "Current status is required" });
    }

    const query = { _id: id };
    if (userRole !== "SUPER_ADMIN") {
      query.agencyId = userAgencyId;
    }

    const updates = { currentStatus };

    if (currentStatus === "Available") {
      updates.joinDate = null;
      if (availableFrom) updates.availableFrom = availableFrom;
    } else if (currentStatus === "Onboard") {
      if (joinDate) updates.joinDate = joinDate;
    }

    const candidate = await Candidate.findOneAndUpdate(query, updates, {
      new: true,
    })
      .populate("agencyId", "name email industryType")
      .populate("addedBy", "name email");

    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    res.json(candidate);
  } catch (error) {
    console.error("Update candidate status error:", error);
    res.status(500).json({
      message: "Error updating candidate status, please try again later",
    });
  }
};

exports.getAvailable = async (req, res) => {
  try {
    const { rank, vesselType } = req.query;
    const userRole = req.user.role;
    const userAgencyId = req.user.agencyId;

    const filter = {
      currentStatus: "Available",
      isActive: true,
      isDeleted: false,
    };

    if (userRole !== "SUPER_ADMIN") {
      filter.agencyId = userAgencyId;
    }

    if (rank) filter.rank = rank;
    if (vesselType) filter.vesselType = vesselType;

    const candidates = await Candidate.find(filter)
      .select(
        "firstName lastName email phone rank vesselType availableFrom totalSeaExperience",
      )
      .populate("addedBy", "name email")
      .sort({ availableFrom: 1, createdAt: -1 })
      .lean();

    res.json(candidates);
  } catch (error) {
    console.error("Get available candidates error:", error);
    res.status(500).json({ message: "Failed to fetch available candidates" });
  }
};

exports.bulkImport = async (req, res) => {
  res.json({ message: "Bulk import coming soon" });
};

exports.exportList = async (req, res) => {
  res.json({ message: "Export coming soon" });
};

// Helper functions
const processUploadedFiles = (files, existingDocs = {}) => {
  const result = {};

  // Single file documents
  if (files.photo && files.photo[0]) {
    result.photo = mapFile(files.photo[0]);
  }

  if (files.aadhar && files.aadhar[0]) {
    result.aadhar = mapFile(files.aadhar[0]);
  }

  if (files.pan && files.pan[0]) {
    result.pan = mapFile(files.pan[0]);
  }

  // Documents with main/old structure
  const docsWithVersions = [
    "passport",
    "cdc",
    "indos",
    "visa",
    "medicalCertificate",
    "seamanBook",
    "resume",
  ];

  docsWithVersions.forEach((docType) => {
    if (files[docType] && files[docType][0]) {
      result[docType] = {
        main: mapFile(files[docType][0]),
        old: existingDocs[docType]?.main || null,
      };
    }
  });

  return result;
};

function mapFile(file) {
  return {
    filename: file.filename,
    originalName: file.originalname,
    path: file.path,
    mimetype: file.mimetype,
    size: file.size,
    uploadedAt: new Date(),
  };
}

function cleanupFiles(files = {}) {
  Object.values(files)
    .flat()
    .forEach((file) => deleteFile(file?.path));
}
