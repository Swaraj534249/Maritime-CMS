const { asyncHandler } = require("../middleware/asyncHandler");
const vesselService = require("../services/domain/vessel.service");

exports.create = asyncHandler(async (req, res) => {
  const created = await vesselService.create(req);
  res.status(201).json(created);
});

exports.list = asyncHandler(async (req, res) => {
  const result = await vesselService.list(req);
  res.json(result);
});

exports.getById = asyncHandler(async (req, res) => {
  const result = await vesselService.getById(req);
  res.status(200).json(result);
});

exports.updateById = asyncHandler(async (req, res) => {
  const updated = await vesselService.updateById(req);
  res.status(200).json(updated);
});

exports.toggleStatus = asyncHandler(async (req, res) => {
  const vessel = await vesselService.toggleStatus(req);
  res.json(vessel);
});

exports.bulkImport = asyncHandler(async (req, res) => {
  res.json(vesselService.bulkImport());
});

exports.exportList = asyncHandler(async (req, res) => {
  res.json(vesselService.exportList());
});
