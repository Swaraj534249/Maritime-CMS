import { axiosi } from "../../config/axios";
import { normalizeListResponse } from "../../config/normalizeListResponse";

export const createCandidate = async (data) => {
  try {
    const isFormData = data instanceof FormData;
    const res = await axiosi.post("/candidates", data, {
      headers: isFormData
        ? {
            "Content-Type": "multipart/form-data",
          }
        : undefined,
    });
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getCandidateById = async (id) => {
  try {
    const res = await axiosi.get(`/candidates/${id}`);
    return res.data;
  } catch (error) {
    throw error.response?.data ?? error;
  }
};

export const fetchCandidates = async (params = {}, signal) => {
  try {
    const res = await axiosi.get("/candidates", { params, signal });
    return normalizeListResponse(res);
  } catch (error) {
    if (error.name === "CanceledError" || error.code === "ERR_CANCELED") {
      throw error;
    }
    throw error.response?.data ?? error;
  }
};

export const updateCandidateById = async (data) => {
  try {
    const isFormData = data instanceof FormData;
    const id = isFormData ? data.get("_id") : data._id;
    
    const res = await axiosi.patch(`/candidates/${id}`, data, {
      headers: isFormData
        ? {
            "Content-Type": "multipart/form-data",
          }
        : undefined,
    });
    return res.data;
  } catch (error) {
    throw error.response?.data ?? error;
  }
};

export const toggleCandidateStatus = async (candidateId) => {
  try {
    const res = await axiosi.patch(`/candidates/${candidateId}/toggle-status`);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateCandidateWorkStatus = async ({ id, statusData }) => {
  try {
    const res = await axiosi.patch(`/candidates/${id}/update-status`, statusData);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getAvailableCandidates = async (params = {}) => {
  try {
    const res = await axiosi.get("/candidates/available", { params });
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// CV Parsing endpoint (to be implemented)
export const parseResume = async (file) => {
  try {
    const formData = new FormData();
    formData.append("resume", file);
    
    const res = await axiosi.post("/candidates/parse-resume", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};