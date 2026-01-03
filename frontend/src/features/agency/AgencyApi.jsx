import { axiosi } from "../../config/axios";
import { normalizeListResponse } from "../../config/normalizeListResponse";

export const createAgency = async (data) => {
  try {
    const res = await axiosi.post("/agencies", data);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getAgencyById = async (id) => {
  try {
    const res = await axiosi.get(`/agencies/${id}`);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const fetchAgencies = async (params = {}, signal) => {
  try {
    const res = await axiosi.get("/agencies", { params, signal });
    return normalizeListResponse(res);
  } catch (error) {
    if (error.name === "CanceledError" || error.code === "ERR_CANCELED") {
      throw error;
    }
    throw error.response?.data ?? error;
  }
};

export const updateAgencyById = async ({ id, data }) => {
  try {
    const res = await axiosi.put(`/agencies/${id}`, data);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const toggleAgencyStatus = async (agencyId) => {
  try {
    const res = await axiosi.patch(`/agencies/${agencyId}/toggle-status`);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};