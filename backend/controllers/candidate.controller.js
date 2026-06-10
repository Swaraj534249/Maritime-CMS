const { asyncHandler } = require("../middleware/asyncHandler");
const candidateService = require("../services/domain/candidate.service");

exports.parseResume = asyncHandler(async (req, res) => {
  const out = await candidateService.parseResume(req);
  res.json(out);
});

exports.create = asyncHandler(async (req, res) => {
  const candidate = await candidateService.create(req);
  res.status(201).json(candidate);
});

exports.list = asyncHandler(async (req, res) => {
  const result = await candidateService.list(req);
  res.json(result);
});

exports.statusCounts = asyncHandler(async (req, res) => {
  const result = await candidateService.statusCounts(req);
  res.json(result);
});

exports.getById = asyncHandler(async (req, res) => {
  const candidate = await candidateService.getById(req);
  res.status(200).json(candidate);
});

exports.updateById = asyncHandler(async (req, res) => {
  const candidate = await candidateService.updateById(req);
  res.status(200).json(candidate);
});

exports.toggleStatus = asyncHandler(async (req, res) => {
  const candidate = await candidateService.toggleStatus(req);
  res.json(candidate);
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const candidate = await candidateService.updateStatus(req);
  res.json(candidate);
});

exports.getAvailable = asyncHandler(async (req, res) => {
  const candidates = await candidateService.getAvailable(req);
  res.json(candidates);
});

exports.bulkImport = asyncHandler(async (req, res) => {
  const out = await candidateService.bulkImport(req);
  res.json(out);
});

exports.exportList = asyncHandler(async (req, res) => {
  const out = await candidateService.exportList(req);
  res.json(out);
});
