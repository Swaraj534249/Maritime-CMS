const Candidate = require("../../models/Candidate");
const Agency = require("../../models/Agency");
const { AppError } = require("../../errors/AppError");
const { deleteFile } = require("../../middleware/upload");
const {
  processPresignedUploads,
  cleanupPresignedUploads,
  assignVersionedDocument,
} = require("./candidateFiles.helper");
const { hasStoredFile } = require("../../utils/versionedDocument");
const { buildListQuery } = require("../../utils/ListQueryBuilder");
const { buildListResponse } = require("../../utils/ListResponseBuilder");
const resumeParser = require("../../utils/ResumeParser");
const { enrichDeep } = require("../../aws/s3/fileAccess.service");
const { assertUniqueWithinAgency, normalizeCheckValue } = require("../../utils/tenantUniqueness");

function coalesceIdentityField(updates, existing, field) {
  if (updates[field] !== undefined) {
    const normalized = normalizeCheckValue(updates[field], field);
    if (normalized) return normalized;
  }
  return existing[field];
}

function normalizeCandidateIdentityFields(data) {
  if (!data) return data;
  for (const field of ["email", "indosNumber", "aadharNumber", "panNumber", "passportNumber"]) {
    if (data[field] == null) continue;
    const normalized = normalizeCheckValue(data[field], field);
    if (normalized) data[field] = normalized;
    else delete data[field];
  }
  return data;
}

async function assertCandidateUniqueInAgency(agencyId, data, excludeId) {
  normalizeCandidateIdentityFields(data);
  await assertUniqueWithinAgency({
    Model: Candidate,
    agencyId,
    excludeId,
    checks: [
      {
        field: "email",
        value: data.email,
        message: "Candidate with this email already exists in your agency",
      },
      {
        field: "indosNumber",
        value: data.indosNumber,
        message: "Candidate with this INDOS number already exists in your agency",
      },
      {
        field: "aadharNumber",
        value: data.aadharNumber,
        message: "Candidate with this Aadhar number already exists in your agency",
      },
      {
        field: "panNumber",
        value: data.panNumber,
        message: "Candidate with this PAN number already exists in your agency",
      },
    ],
  });
}

async function parseResume(req) {
  try {
    if (!req.file?.buffer?.length) {
      throw new AppError(400, "Resume file is required", { extra: { success: false } });
    }

    const parsedData = await resumeParser.parseResume(
      req.file.buffer,
      req.file.mimetype,
    );

    return {
      success: true,
      data: parsedData,
      message: "Resume parsed successfully",
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Resume parsing error:", error);

    throw new AppError(500, "Failed to parse resume. Please fill the form manually.", {
      extra: {
        success: false,
        ...(process.env.NODE_ENV === "development" && error.message
          ? { error: error.message }
          : {}),
      },
    });
  }
}

async function create(req) {
  try {
    const data = normalizeCandidateIdentityFields({ ...req.body });
    const userRole = req.user.role;
    const userAgencyId = req.user.agencyId;

    // Determine target agency
    let targetAgencyId;
    if (userRole === "SUPER_ADMIN") {
      targetAgencyId = data.agencyId;
      if (!targetAgencyId) {
        throw new AppError(400, "Agency ID is required for super admin");
      }
    } else {
      targetAgencyId = userAgencyId;
      data.agencyId = targetAgencyId;
    }

    // Verify agency exists and is active
    const agency = await Agency.findById(targetAgencyId);
    if (!agency) {
      throw new AppError(404, "Agency not found");
    }

    if (!agency.isActive) {
      throw new AppError(403, "Cannot add candidate. Agency is inactive");
    }

    // Set industryType from agency
    data.industryType = agency.industryType;

    // Set addedBy
    data.addedBy = req.user._id;

    await assertCandidateUniqueInAgency(targetAgencyId, data);

    const candidate = new Candidate(data);
    await candidate.save();

    // Populate before sending response
    await candidate.populate([
      { path: "agencyId", select: "name email industryType" },
      { path: "addedBy", select: "name email" },
    ]);

    return enrichDeep(candidate);
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Create candidate error:", error);
    throw new AppError(500, "Error adding candidate, please try again later");
  }
}

async function list(req) {
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
        throw new AppError(400, "Agency ID not found for user");
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
      return Promise.all(data.map((row) => enrichDeep(row)));
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

    const enrichedData = await Promise.all(data.map((row) => enrichDeep(row)));

    return buildListResponse({
        data: enrichedData,
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
      });
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("List candidates error:", error);
    throw new AppError(500, "Failed to fetch candidates");
  }
}

async function getById(req) {
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
      throw new AppError(404, "Candidate not found");
    }

    return enrichDeep(candidate);
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Get candidate error:", error);
    throw new AppError(500, "Error getting candidate details, please try again later");
  }
}

async function updateById(req) {
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
      throw new AppError(404, "Candidate not found");
    }

    const merged = {
      email: coalesceIdentityField(updates, existing, "email"),
      indosNumber: coalesceIdentityField(updates, existing, "indosNumber"),
      aadharNumber: coalesceIdentityField(updates, existing, "aadharNumber"),
      panNumber: coalesceIdentityField(updates, existing, "panNumber"),
    };
    await assertCandidateUniqueInAgency(existing.agencyId, merged, id);

    // Never replace the whole documents object — merge file updates in place.
    delete updates.documents;
    delete updates.s3_uploads;

    if (req.presignedUploads) {
      const uploadedFiles = processPresignedUploads(
        req.presignedUploads,
        existing.documents,
      );

      if (!existing.documents) {
        existing.documents = {};
      }

      if (uploadedFiles.photo) {
        if (existing.documents.photo?.path) {
          await deleteFile(existing.documents.photo.path);
        }
        existing.documents.photo = uploadedFiles.photo;
      }

      const docsWithVersions = [
        "passport",
        "cdc",
        "indos",
        "visa",
        "medicalCertificate",
        "seamanBook",
        "resume",
      ];
      for (const docType of docsWithVersions) {
        if (uploadedFiles[docType]) {
          if (hasStoredFile(existing.documents[docType]?.old)) {
            await deleteFile(existing.documents[docType].old.path);
          }
          assignVersionedDocument(
            existing.documents,
            docType,
            uploadedFiles[docType],
          );
        }
      }

      for (const docType of ["aadhar", "pan"]) {
        if (uploadedFiles[docType]) {
          if (existing.documents[docType]?.path) {
            await deleteFile(existing.documents[docType].path);
          }
          existing.documents[docType] = uploadedFiles[docType];
        }
      }

      existing.markModified("documents");
    }

    Object.assign(existing, updates);
    await existing.save();

    await existing.populate([
      { path: "agencyId", select: "name email industryType" },
      { path: "addedBy", select: "name email" },
    ]);

    return enrichDeep(existing);
  } catch (error) {
    if (req.presignedUploads) await cleanupPresignedUploads(req.presignedUploads);
    if (error instanceof AppError) throw error;
    console.error("Update candidate error:", error);
    throw new AppError(500, "Error updating candidate, please try again later");
  }
}

async function toggleStatus(req) {
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
      throw new AppError(404, "Candidate not found");
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

    return candidate;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Toggle candidate status error:", error);
    throw new AppError(500, "Error updating candidate status, please try again later");
  }
}

async function updateStatus(req) {
  try {
    const { id } = req.params;
    const { currentStatus, availableFrom, joinDate } = req.body;
    const userRole = req.user.role;
    const userAgencyId = req.user.agencyId;

    if (!currentStatus) {
      throw new AppError(400, "Current status is required");
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
      throw new AppError(404, "Candidate not found");
    }

    return candidate;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Update candidate status error:", error);
    throw new AppError(500, "Error updating candidate status, please try again later");
  }
}

async function getAvailable(req) {
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

    return candidates;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Get available candidates error:", error);
    throw new AppError(500, "Failed to fetch available candidates");
  }
}

async function bulkImport(req) {
  return { message: "Bulk import coming soon" };
}

async function exportList(req) {
  return { message: "Export coming soon" };
}


module.exports = {
  parseResume,
  create,
  list,
  getById,
  updateById,
  toggleStatus,
  updateStatus,
  getAvailable,
  bulkImport,
  exportList,
};
