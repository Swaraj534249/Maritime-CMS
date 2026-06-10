const { asyncHandler } = require("../middleware/asyncHandler");
const proposalService = require("../services/domain/proposal.service");

exports.eligibleCandidates = asyncHandler(async (req, res) => {
  const data = await proposalService.eligibleCandidates(req);
  res.json(data);
});

exports.propose = asyncHandler(async (req, res) => {
  const data = await proposalService.propose(req);
  res.status(201).json(data);
});

exports.list = asyncHandler(async (req, res) => {
  const result = await proposalService.list(req);
  res.json(result);
});

exports.statusCounts = asyncHandler(async (req, res) => {
  const result = await proposalService.statusCounts(req);
  res.json(result);
});

exports.select = asyncHandler(async (req, res) => {
  const data = await proposalService.select(req);
  res.status(200).json(data);
});

exports.reject = asyncHandler(async (req, res) => {
  const data = await proposalService.reject(req);
  res.status(200).json(data);
});

exports.updateChecklist = asyncHandler(async (req, res) => {
  const data = await proposalService.updateChecklist(req);
  res.status(200).json(data);
});
