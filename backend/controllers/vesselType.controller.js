const { asyncHandler } = require("../middleware/asyncHandler");
const vesselTypeService = require("../services/domain/vesselType.service");

exports.create = asyncHandler(async (req, res) => {
  const created = await vesselTypeService.create(req);
  res.status(201).json(created);
});

exports.list = asyncHandler(async (req, res) => {
  const data = await vesselTypeService.list(req);
  res.json(data);
});

exports.updateById = asyncHandler(async (req, res) => {
  const updated = await vesselTypeService.updateById(req);
  res.status(200).json(updated);
});

exports.toggleStatus = asyncHandler(async (req, res) => {
  const updated = await vesselTypeService.toggleStatus(req);
  res.status(200).json(updated);
});
