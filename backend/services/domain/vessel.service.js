const Vessel = require("../../models/Vessel");
const VesselOwner = require("../../models/VesselOwner");
const { AppError } = require("../../errors/AppError");
const { deleteFile } = require("../../middleware/upload");
const { buildListQuery } = require("../../utils/ListQueryBuilder");
const { buildListResponse } = require("../../utils/ListResponseBuilder");
const { enrichDeep } = require("../../aws/s3/fileAccess.service");
const {
  processPresignedUploads,
  cleanupPresignedUploads,
  assignVersionedField,
} = require("./vesselFiles.helper");
const { hasStoredFile } = require("../../utils/versionedDocument");
const { assertUniqueWithinAgency } = require("../../utils/tenantUniqueness");

async function assertVesselUniqueInAgency(agencyId, data, excludeId) {
  await assertUniqueWithinAgency({
    Model: Vessel,
    agencyId,
    excludeId,
    checks: [
      {
        field: "vesselname",
        value: data.vesselname,
        message: "Vessel with this name already exists in your agency",
      },
    ],
  });
}

async function create(req) {
  const data = { ...req.body };

  if (data.vesselOwner) {
    const owner = await VesselOwner.findById(data.vesselOwner)
      .select("agencyId")
      .lean();
    if (owner?.agencyId) data.agencyId = owner.agencyId;
  }
  if (req.user?.role !== "SUPER_ADMIN" && req.user?.agencyId) {
    data.agencyId = req.user.agencyId;
  }
  if (req.user?._id) data.addedBy = req.user._id;

  await assertVesselUniqueInAgency(data.agencyId, data);

  try {
    const created = await new Vessel(data).save();
    return enrichDeep(created);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(500, "Error adding Vessel, please try again later");
  }
}

async function list(req) {
  const {
    page,
    limit,
    searchValue,
    sortField,
    sortOrder,
    all,
    isDeleted,
  } = req.query;

  const pageNumber = Number(page || 1);
  const pageSizeNumber = Number(limit || 10);

  const extraFilter =
    isDeleted === "true"
      ? { isDeleted: true }
      : {
          $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
        };

  if (req.user?.role !== "SUPER_ADMIN" && req.user?.agencyId) {
    extraFilter.agencyId = req.user.agencyId;
  }

  let vesselOwnerContext = null;
  if (req.query.vesselOwnerId) {
    extraFilter.vesselOwner = req.query.vesselOwnerId;
    const owner = await VesselOwner.findById(
      req.query.vesselOwnerId,
      "company_name company_shortname",
    ).lean();
    if (owner) {
      vesselOwnerContext = {
        _id: owner._id,
        name: owner.company_name,
        shortName: owner.company_shortname,
      };
    }
  }

  const { queryFilter, skip, sort } = buildListQuery({
    Model: Vessel,
    searchValue,
    searchFields: [
      "vesselname",
      "vessel_category",
      "vesseltype",
      "imo_Number",
      "flag",
    ],
    page: pageNumber,
    pageSize: pageSizeNumber,
    sortField,
    sortOrder,
    extraFilter,
  });

  if (all === "true") {
    const data = await Vessel.find(queryFilter)
      .sort(sort)
      .populate("vesselOwner", "company_name company_shortname")
      .lean();
    return Promise.all(data.map((row) => enrichDeep(row)));
  }

  const [data, totalRecords] = await Promise.all([
    Vessel.find(queryFilter)
      .skip(skip)
      .limit(pageSizeNumber)
      .sort(sort)
      .populate("vesselOwner", "company_name company_shortname")
      .lean(),
    Vessel.countDocuments(queryFilter),
  ]);

  const enrichedData = await Promise.all(data.map((row) => enrichDeep(row)));

  return buildListResponse({
    data: enrichedData,
    page: pageNumber,
    pageSize: pageSizeNumber,
    totalRecords,
    searchValue,
    sortField,
    sortOrder,
    aggregates: {},
    context: { vesselOwner: vesselOwnerContext },
  });
}

async function getById(req) {
  const result = await Vessel.findById(req.params.id).populate(
    "vesselOwner",
    "company_name company_shortname",
  );
  if (!result) throw new AppError(404, "Vessel not found");

  if (
    req.user.role !== "SUPER_ADMIN" &&
    result.agencyId &&
    String(result.agencyId) !== String(req.user.agencyId)
  ) {
    throw new AppError(403, "Access denied");
  }

  return enrichDeep(result);
}

async function updateById(req) {
  const { id } = req.params;
  const data = { ...req.body };

  const query = { _id: id };
  if (req.user.role !== "SUPER_ADMIN" && req.user.agencyId) {
    query.agencyId = req.user.agencyId;
  }

  const existing = await Vessel.findOne(query);
  if (!existing) throw new AppError(404, "Vessel not found");

  await assertVesselUniqueInAgency(
    existing.agencyId,
    { vesselname: data.vesselname ?? existing.vesselname },
    id,
  );

  if (req.presignedUploads) {
    const uploadedFiles = processPresignedUploads(
      req.presignedUploads,
      existing,
    );

    if (uploadedFiles.vessel_image) {
      if (existing.vessel_image?.path) {
        await deleteFile(existing.vessel_image.path);
      }
      data.vessel_image = uploadedFiles.vessel_image;
    }

    if (uploadedFiles.vessel_documents) {
      if (hasStoredFile(existing.vessel_documents?.old)) {
        await deleteFile(existing.vessel_documents.old.path);
      }
      assignVersionedField(existing, "vessel_documents", uploadedFiles.vessel_documents);
      data.vessel_documents = existing.vessel_documents;
    }
  }

  delete data.s3_uploads;

  try {
    const updated = await Vessel.findOneAndUpdate(query, data, {
      new: true,
    }).populate("vesselOwner");
    return enrichDeep(updated);
  } catch (error) {
    if (req.presignedUploads) await cleanupPresignedUploads(req.presignedUploads);
    throw new AppError(500, "Error updating Vessel, please try again later");
  }
}

async function toggleStatus(req) {
  const query = { _id: req.params.id };
  if (req.user.role !== "SUPER_ADMIN" && req.user.agencyId) {
    query.agencyId = req.user.agencyId;
  }

  const vessel = await Vessel.findOne(query);
  if (!vessel) throw new AppError(404, "Vessel not found");

  vessel.isDeleted = !vessel.isDeleted;
  await vessel.save();
  return vessel;
}

function bulkImport() {
  return { message: "Bulk import coming soon" };
}

function exportList() {
  return { message: "Export coming soon" };
}

module.exports = {
  create,
  list,
  getById,
  updateById,
  toggleStatus,
  bulkImport,
  exportList,
};
