const VesselOwner = require("../../models/VesselOwner");
const Vessel = require("../../models/Vessel");
const { AppError } = require("../../errors/AppError");
const { deleteFile } = require("../../middleware/upload");
const { buildListQuery } = require("../../utils/ListQueryBuilder");
const { buildListResponse } = require("../../utils/ListResponseBuilder");
const { enrichDeep } = require("../../aws/s3/fileAccess.service");
const {
  processPresignedUploads,
  cleanupPresignedUploads,
  assignVersionedField,
} = require("./vesselOwnerFiles.helper");
const { hasStoredFile } = require("../../utils/versionedDocument");
const { assertUniqueWithinAgency } = require("../../utils/tenantUniqueness");

async function assertVesselOwnerUniqueInAgency(agencyId, data, excludeId) {
  await assertUniqueWithinAgency({
    Model: VesselOwner,
    agencyId,
    excludeId,
    checks: [
      {
        field: "company_shortname",
        value: data.company_shortname,
        message:
          "Vessel owner with this company short name already exists in your agency",
      },
      {
        field: "company_name",
        value: data.company_name,
        message:
          "Vessel owner with this company name already exists in your agency",
      },
      {
        field: "email",
        value: data.email,
        message:
          "Vessel owner with this company email already exists in your agency",
      },
    ],
  });
}

async function create(req) {
  const data = { ...req.body };

  if (req.user.role !== "SUPER_ADMIN") {
    data.agencyId = req.user.agencyId;
    data.addedBy = req.user._id;
  } else if (req.body.agencyId) {
    data.agencyId = req.body.agencyId;
    data.addedBy = req.user._id;
  }

  await assertVesselOwnerUniqueInAgency(data.agencyId, data);

  try {
    const created = await new VesselOwner(data).save();
    return enrichDeep(created);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      500,
      "Error adding Vessel Owner, please trying again later",
    );
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

  if (req.user?.role !== "SUPER_ADMIN" && req.user.agencyId) {
    extraFilter.agencyId = req.user.agencyId;
  }

  const { queryFilter, skip, sort } = buildListQuery({
    Model: VesselOwner,
    searchValue,
    searchFields: [
      "company_name",
      "company_shortname",
      "contactperson",
      "email",
      "phoneno",
      "address",
      "crewing_department1",
      "crewing_department11",
    ],
    page: pageNumber,
    pageSize: pageSizeNumber,
    sortField,
    sortOrder,
    extraFilter,
  });

  if (all === "true") {
    const data = await VesselOwner.find(queryFilter).sort(sort).lean();
    return Promise.all(data.map((row) => enrichDeep(row)));
  }

  const [data, totalRecords] = await Promise.all([
    VesselOwner.find(queryFilter)
      .skip(skip)
      .limit(pageSizeNumber)
      .sort(sort)
      .lean(),
    VesselOwner.countDocuments(queryFilter),
  ]);

  const ownerIds = data.map((o) => o._id);
  const vesselCounts = await Vessel.aggregate([
    {
      $match: {
        vesselOwner: { $in: ownerIds },
        $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
      },
    },
    { $group: { _id: "$vesselOwner", count: { $sum: 1 } } },
  ]);

  const vesselCountByOwner = {};
  vesselCounts.forEach((v) => {
    if (v._id) vesselCountByOwner[v._id.toString()] = v.count;
  });

  const enrichedData = await Promise.all(data.map((row) => enrichDeep(row)));

  return buildListResponse({
    data: enrichedData,
    page: pageNumber,
    pageSize: pageSizeNumber,
    totalRecords,
    searchValue,
    sortField,
    sortOrder,
    aggregates: { vesselCountByOwner },
  });
}

async function getById(req) {
  const result = await VesselOwner.findById(req.params.id);
  if (!result) throw new AppError(404, "Vessel Owner not found");

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

  const existing = await VesselOwner.findOne(query);
  if (!existing) throw new AppError(404, "Vessel Owner not found");

  await assertVesselOwnerUniqueInAgency(
    existing.agencyId,
    {
      company_shortname:
        data.company_shortname ?? existing.company_shortname,
      company_name: data.company_name ?? existing.company_name,
      email: data.email ?? existing.email,
    },
    id,
  );

  const filePayload = req.presignedUploads
    ? processPresignedUploads(req.presignedUploads, existing)
    : null;

  if (filePayload) {
    if (filePayload.company_logo) {
      if (existing.company_logo?.path) {
        await deleteFile(existing.company_logo.path);
      }
      data.company_logo = filePayload.company_logo;
    }
    if (filePayload.contract) {
      if (hasStoredFile(existing.contract?.old)) {
        await deleteFile(existing.contract.old.path);
      }
      assignVersionedField(existing, "contract", filePayload.contract);
      data.contract = existing.contract;
    }
    if (filePayload.license) {
      if (hasStoredFile(existing.license?.old)) {
        await deleteFile(existing.license.old.path);
      }
      assignVersionedField(existing, "license", filePayload.license);
      data.license = existing.license;
    }
  }

  delete data.s3_uploads;

  try {
    const updated = await VesselOwner.findOneAndUpdate(query, data, {
      new: true,
    });
    return enrichDeep(updated);
  } catch (error) {
    if (req.presignedUploads) await cleanupPresignedUploads(req.presignedUploads);
    throw new AppError(
      500,
      "Error updating Vessel Owner, please try again later",
    );
  }
}

async function toggleStatus(req) {
  const query = { _id: req.params.id };
  if (req.user.role !== "SUPER_ADMIN" && req.user.agencyId) {
    query.agencyId = req.user.agencyId;
  }

  const owner = await VesselOwner.findOne(query);
  if (!owner) throw new AppError(404, "Vessel Owner not found");

  owner.isDeleted = !owner.isDeleted;
  await owner.save();
  return owner;
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
