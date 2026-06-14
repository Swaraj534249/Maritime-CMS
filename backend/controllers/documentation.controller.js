const { asyncHandler } = require("../middleware/asyncHandler");
const documentationService = require("../services/domain/documentation.service");

exports.list = asyncHandler(async (req, res) => {
  const result = await documentationService.list(req);
  res.json(result);
});

exports.statusCounts = asyncHandler(async (req, res) => {
  const result = await documentationService.statusCounts(req);
  res.json(result);
});

exports.getById = asyncHandler(async (req, res) => {
  const data = await documentationService.getById(req);
  res.status(200).json(data);
});

exports.verifyDocument = asyncHandler(async (req, res) => {
  const data = await documentationService.verifyDocument(req);
  res.status(200).json(data);
});
