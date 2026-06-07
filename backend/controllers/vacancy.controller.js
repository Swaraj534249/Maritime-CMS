const { asyncHandler } = require("../middleware/asyncHandler");
const vacancyService = require("../services/domain/vacancy.service");

exports.create = asyncHandler(async (req, res) => {
  const created = await vacancyService.create(req);
  res.status(201).json(created);
});

exports.list = asyncHandler(async (req, res) => {
  const result = await vacancyService.list(req);
  res.json(result);
});

exports.getById = asyncHandler(async (req, res) => {
  const data = await vacancyService.getById(req);
  res.status(200).json(data);
});

exports.updateById = asyncHandler(async (req, res) => {
  const updated = await vacancyService.updateById(req);
  res.status(200).json(updated);
});

exports.closeById = asyncHandler(async (req, res) => {
  const updated = await vacancyService.closeById(req);
  res.status(200).json(updated);
});
