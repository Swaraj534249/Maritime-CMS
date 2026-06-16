const { asyncHandler } = require("../middleware/asyncHandler");
const userService = require("../services/domain/user.service");
const { sanitizeUser } = require("../utils/SanitizeUser");

exports.getAll = asyncHandler(async (req, res) => {
  const result = await userService.getAllList(req);
  if (Array.isArray(result)) {
    return res.json(result);
  }
  const total = result?.result?.meta?.pagination?.totalRecords;
  if (typeof total === "number") {
    res.set("X-Total-Count", String(total));
  }
  return res.json(result);
});

exports.getById = asyncHandler(async (req, res) => {
  const user = await userService.getById(req.params.id);
  res.status(200).json(user);
});

exports.updateById = asyncHandler(async (req, res) => {
  const updated = await userService.updateById(req.params.id, req.body);
  res.status(200).json(updated);
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const updated = await userService.updateProfile(req, req.presignedUploads);
  res.status(200).json(updated);
});

exports.completeOnboarding = asyncHandler(async (req, res) => {
  const updated = await userService.completeOnboarding(req, req.presignedUploads);
  const agency =
    updated.agencyId && typeof updated.agencyId === "object"
      ? updated.agencyId
      : null;
  const base = sanitizeUser(updated, agency);
  res.status(200).json({
    ...updated,
    ...base,
    avatar: updated.avatar,
    aadhar: updated.aadhar,
    pan: updated.pan,
  });
});
