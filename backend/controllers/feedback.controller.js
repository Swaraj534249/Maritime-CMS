const { asyncHandler } = require("../middleware/asyncHandler");
const feedbackService = require("../services/domain/feedback.service");

exports.submit = asyncHandler(async (req, res) => {
  const data = await feedbackService.submit(req);
  res.status(201).json(data);
});

exports.list = asyncHandler(async (req, res) => {
  const result = await feedbackService.list(req);
  res.json(result);
});

exports.getById = asyncHandler(async (req, res) => {
  const data = await feedbackService.getById(req);
  res.status(200).json(data);
});

exports.updateById = asyncHandler(async (req, res) => {
  const data = await feedbackService.updateById(req);
  res.status(200).json(data);
});
