const User = require("../../models/User");
const { AppError } = require("../../errors/AppError");
const { buildListQuery } = require("../../utils/ListQueryBuilder");
const { buildListResponse } = require("../../utils/ListResponseBuilder");
const { enrichDeep } = require("../../aws/s3/fileAccess.service");
const { STATUS, normalizeStatus } = require("../../utils/userStatus");
const { applyProfileFileUploads } = require("./userFiles.helper");

const PROFILE_FIELDS = [
  "name",
  "phone",
  "alternatePhone",
  "dateOfBirth",
  "gender",
  "address",
  "bloodGroup",
  "aadharNumber",
  "panNumber",
  "socialMedia",
];

function assertSelfOrSuperAdmin(req, targetId) {
  if (req.user.role === "SUPER_ADMIN") return;
  if (String(req.user._id) !== String(targetId)) {
    throw new AppError(403, "You can only update your own profile");
  }
}

function pickProfileFields(body) {
  const out = {};
  for (const key of PROFILE_FIELDS) {
    if (body[key] !== undefined) out[key] = body[key];
  }
  if (body.linkedin !== undefined || body.instagram !== undefined || body.facebook !== undefined) {
    out.socialMedia = {
      linkedin: body.linkedin ?? body.socialMedia?.linkedin ?? "",
      instagram: body.instagram ?? body.socialMedia?.instagram ?? "",
      facebook: body.facebook ?? body.socialMedia?.facebook ?? "",
    };
  }
  if (out.dateOfBirth) {
    out.dateOfBirth = new Date(out.dateOfBirth);
  }
  if (!out.bloodGroup) delete out.bloodGroup;
  if (!out.gender) delete out.gender;
  return out;
}

function validateOnboardingRequired(updates) {
  const missing = [];
  if (!updates.name?.trim()) missing.push("name");
  if (!updates.phone?.trim()) missing.push("phone");
  if (!updates.dateOfBirth) missing.push("dateOfBirth");
  if (!updates.gender?.trim()) missing.push("gender");
  if (!updates.address?.trim()) missing.push("address");
  if (missing.length) {
    throw new AppError(400, `Required fields: ${missing.join(", ")}`);
  }
}

async function getAllList(req) {
  const { page, limit, searchValue, sortField, sortOrder, all } = req.query;
  const pageNumber = Number(page || 1);
  const pageSizeNumber = Number(limit || 10);

  const extraFilter = {};
  if (req.query.user) {
    extraFilter.isDeleted = false;
  }

  const { queryFilter, skip, sort } = buildListQuery({
    filter: {},
    searchValue,
    searchFields: ["name", "email"],
    page: pageNumber,
    pageSize: pageSizeNumber,
    sortField: sortField || "_id",
    sortOrder: sortOrder || "desc",
    extraFilter,
  });

  if (all === "true") {
    const data = await User.find(queryFilter)
      .select("-password")
      .sort(sort)
      .lean();
    return data;
  }

  const [data, totalRecords] = await Promise.all([
    User.find(queryFilter)
      .select("-password")
      .skip(skip)
      .limit(pageSizeNumber)
      .sort(sort)
      .lean(),
    User.countDocuments(queryFilter),
  ]);

  return buildListResponse({
    data,
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

async function getById(id) {
  const result = await User.findById(id)
    .select("-password")
    .populate("agencyId", "name shortName email industryType")
    .lean();
  if (!result) {
    throw new AppError(404, "User not found");
  }
  return enrichDeep(result);
}

async function updateById(id, body) {
  const updates = { ...body };
  delete updates.password;
  delete updates.role;
  delete updates.agencyId;
  delete updates.industryType;
  delete updates.createdBy;
  delete updates._id;
  delete updates.email;
  delete updates.status;

  const updated = await User.findOneAndUpdate(
    { _id: id },
    { $set: updates },
    { new: true, runValidators: true },
  )
    .select("-password")
    .populate("agencyId", "name email industryType")
    .lean();
  if (!updated) {
    throw new AppError(404, "User not found");
  }
  return enrichDeep(updated);
}

async function updateProfile(req, presignedUploads) {
  const { id } = req.params;
  assertSelfOrSuperAdmin(req, id);

  const user = await User.findById(id);
  if (!user) throw new AppError(404, "User not found");

  const status = normalizeStatus(user);
  if (user.role === "AGENT") {
    if (status === STATUS.VERIFIED) {
      throw new AppError(
        400,
        "Please complete your profile setup before editing details",
      );
    }
    if (status !== STATUS.ACTIVE && req.user.role !== "SUPER_ADMIN") {
      throw new AppError(
        403,
        "Profile can only be edited when your account is active",
      );
    }
  }

  const updates = pickProfileFields(req.body);
  Object.assign(updates, applyProfileFileUploads(presignedUploads, user));

  const updated = await User.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true },
  )
    .select("-password")
    .populate("agencyId", "name shortName email industryType")
    .lean();

  return enrichDeep(updated);
}

async function completeOnboarding(req, presignedUploads) {
  const { id } = req.params;
  assertSelfOrSuperAdmin(req, id);

  const user = await User.findById(id);
  if (!user) throw new AppError(404, "User not found");
  if (user.role !== "AGENT") {
    throw new AppError(400, "Onboarding is only for agent accounts");
  }
  if (normalizeStatus(user) !== STATUS.VERIFIED) {
    throw new AppError(400, "Profile setup is not required for your account");
  }

  const updates = pickProfileFields(req.body);
  validateOnboardingRequired(updates);
  Object.assign(updates, applyProfileFileUploads(presignedUploads, user));
  updates.status = STATUS.ACTIVE;

  const updated = await User.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true },
  )
    .select("-password")
    .populate("agencyId", "name shortName email industryType")
    .lean();

  return enrichDeep(updated);
}

module.exports = {
  getAllList,
  getById,
  updateById,
  updateProfile,
  completeOnboarding,
};
