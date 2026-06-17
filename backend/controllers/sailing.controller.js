const { asyncHandler } = require("../middleware/asyncHandler");
const sailingService = require("../services/domain/sailing.service");

exports.finalize = asyncHandler(async (req, res) => {
  const data = await sailingService.finalize(req);
  res.status(201).json(data);
});

exports.list = asyncHandler(async (req, res) => {
  const result = await sailingService.list(req);
  res.json(result);
});

exports.statusCounts = asyncHandler(async (req, res) => {
  const result = await sailingService.statusCounts(req);
  res.json(result);
});

exports.signOff = asyncHandler(async (req, res) => {
  const data = await sailingService.signOff(req);
  res.json(data);
});
