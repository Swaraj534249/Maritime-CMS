import { axiosi } from "../../config/axios";
import {
  entityIdFromPayload,
  multipartHeaders,
  rethrowApiError,
} from "../../config/apiHelpers";
import { normalizeListResponse } from "../../config/normalizeListResponse";

export const createCandidate = async (data) => {
  try {
    const res = await axiosi.post("/candidates", data, {
      headers: multipartHeaders(data),
    });
    return res.data;
  } catch (error) {
    rethrowApiError(error);
  }
};

export const getCandidateById = async (id) => {
  try {
    const res = await axiosi.get(`/candidates/${id}`);
    return res.data;
  } catch (error) {
    rethrowApiError(error);
  }
};

export const fetchCandidates = async (params = {}, signal) => {
  try {
    const res = await axiosi.get("/candidates", { params, signal });
    return normalizeListResponse(res);
  } catch (error) {
    rethrowApiError(error);
  }
};

export const updateCandidateById = async (data) => {
  try {
    const id = entityIdFromPayload(data);
    const res = await axiosi.patch(`/candidates/${id}`, data, {
      headers: multipartHeaders(data),
    });
    return res.data;
  } catch (error) {
    rethrowApiError(error);
  }
};

export const toggleCandidateStatus = async (candidateId) => {
  try {
    const res = await axiosi.patch(`/candidates/${candidateId}/toggle-status`);
    return res.data;
  } catch (error) {
    rethrowApiError(error);
  }
};

export const updateCandidateWorkStatus = async ({ id, statusData }) => {
  try {
    const res = await axiosi.patch(`/candidates/${id}/update-status`, statusData);
    return res.data;
  } catch (error) {
    rethrowApiError(error);
  }
};

export const getAvailableCandidates = async (params = {}) => {
  try {
    const res = await axiosi.get("/candidates/available", { params });
    return res.data;
  } catch (error) {
    rethrowApiError(error);
  }
};

export const parseResume = async (file) => {
  try {
    const formData = new FormData();
    formData.append("resume", file);

    const res = await axiosi.post("/candidates/parse-resume", formData, {
      headers: multipartHeaders(formData),
    });
    return res.data;
  } catch (error) {
    rethrowApiError(error);
  }
};
