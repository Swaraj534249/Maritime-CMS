const { asyncHandler } = require("../middleware/asyncHandler");
const agentService = require("../services/domain/agent.service");
const { AGENT_TYPES } = require("../models/schemas/agentTypes");

exports.getTypes = asyncHandler(async (req, res) => {
  res.json(AGENT_TYPES);
});

exports.create = asyncHandler(async (req, res) => {
  const data = await agentService.create(req);
  res.status(201).json(data);
});

exports.list = asyncHandler(async (req, res) => {
  const result = await agentService.list(req);
  res.json(result);
});

exports.getById = asyncHandler(async (req, res) => {
  const agent = await agentService.getById(req);
  res.status(200).json(agent);
});

exports.updateById = asyncHandler(async (req, res) => {
  const agent = await agentService.updateById(req);
  res.status(200).json(agent);
});

exports.toggleStatus = asyncHandler(async (req, res) => {
  const agent = await agentService.toggleStatus(req);
  res.json(agent);
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const out = await agentService.resetPassword(req);
  res.status(200).json(out);
});
