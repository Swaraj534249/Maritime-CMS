import { axiosi } from "../../config/axios";
import { rethrowApiError } from "../../config/apiHelpers";
import { normalizeListResponse } from "../../config/normalizeListResponse";

export const fetchEligibleCandidates = async (vacancyId, signal) => {
  try {
    const res = await axiosi.get("/proposals/eligible", {
      params: { vacancyId },
      signal,
    });
    return res.data;
  } catch (error) {
    rethrowApiError(error);
  }
};

export const proposeCandidates = async ({ vacancyId, candidateIds }) => {
  try {
    const res = await axiosi.post("/proposals", { vacancyId, candidateIds });
    return res.data;
  } catch (error) {
    rethrowApiError(error);
  }
};

export const fetchProposals = async (params = {}, signal) => {
  try {
    const res = await axiosi.get("/proposals", { params, signal });
    return normalizeListResponse(res);
  } catch (error) {
    rethrowApiError(error);
  }
};

export const getProposalById = async (id, signal) => {
  try {
    const res = await axiosi.get(`/proposals/${id}`, { signal });
    return res.data;
  } catch (error) {
    rethrowApiError(error);
  }
};

export const selectProposal = async ({ id, documentationAgentId }) => {
  try {
    const res = await axiosi.patch(`/proposals/${id}/select`, {
      documentationAgentId,
    });
    return res.data;
  } catch (error) {
    rethrowApiError(error);
  }
};

export const fetchAssignableAgents = async (signal) => {
  try {
    const res = await axiosi.get("/proposals/assignable-agents", { signal });
    return res.data;
  } catch (error) {
    rethrowApiError(error);
  }
};

export const rejectProposal = async (id) => {
  try {
    const res = await axiosi.patch(`/proposals/${id}/reject`);
    return res.data;
  } catch (error) {
    rethrowApiError(error);
  }
};

export const updateProposalChecklist = async ({ id, ...checklist }) => {
  try {
    const res = await axiosi.patch(`/proposals/${id}/checklist`, checklist);
    return res.data;
  } catch (error) {
    rethrowApiError(error);
  }
};
