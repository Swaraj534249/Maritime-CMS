const { asyncHandler } = require("../middleware/asyncHandler");
const vesselOwnerService = require("../services/domain/vesselOwner.service");

exports.create = asyncHandler(async (req, res) => {
  const created = await vesselOwnerService.create(req);
  res.status(201).json(created);
});

exports.list = asyncHandler(async (req, res) => {
  const result = await vesselOwnerService.list(req);
  res.set("Cache-Control", "no-store");
  res.json(result);
});

exports.getById = asyncHandler(async (req, res) => {
  const result = await vesselOwnerService.getById(req);
  res.status(200).json(result);
});

exports.updateById = asyncHandler(async (req, res) => {
  const updated = await vesselOwnerService.updateById(req);
  res.status(200).json(updated);
});

exports.toggleStatus = asyncHandler(async (req, res) => {
  const owner = await vesselOwnerService.toggleStatus(req);
  res.json(owner);
});

exports.bulkImport = asyncHandler(async (req, res) => {
  res.json(vesselOwnerService.bulkImport());
});

exports.exportList = asyncHandler(async (req, res) => {
  res.json(vesselOwnerService.exportList());
});
