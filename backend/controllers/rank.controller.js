const { asyncHandler } = require("../middleware/asyncHandler");
const rankService = require("../services/domain/rank.service");

exports.create = asyncHandler(async (req, res) => {
  const created = await rankService.create(req);
  res.status(201).json(created);
});

exports.list = asyncHandler(async (req, res) => {
  const data = await rankService.list(req);
  res.json(data);
});

exports.updateById = asyncHandler(async (req, res) => {
  const updated = await rankService.updateById(req);
  res.status(200).json(updated);
});

exports.toggleStatus = asyncHandler(async (req, res) => {
  const updated = await rankService.toggleStatus(req);
  res.status(200).json(updated);
});
