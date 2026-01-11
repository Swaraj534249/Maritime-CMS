import { axiosi } from "../../config/axios";
import { normalizeListResponse } from "../../config/normalizeListResponse";

export const createVesselOwner = async (data) => {
  try {
    const isFormData = data instanceof FormData;
    const res = await axiosi.post("/vesselOwners", data, {
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

export const getVesselOwnerById = async (id) => {
  try {
    const res = await axiosi.get(`/vesselOwners/${id}`);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const fetchVesselOwners = async (params = {}, signal) => {
  try {
    const res = await axiosi.get("/vesselOwners", { params, signal });
    return normalizeListResponse(res);
  } catch (error) {
    if (error.name === "CanceledError" || error.code === "ERR_CANCELED") {
      throw error;
    }
    throw error.response?.data ?? error;
  }
};

export const updateVesselOwnerById = async (data) => {
  try {
    const isFormData = data instanceof FormData;
    const id = isFormData ? data.get("_id") : data._id;

    const res = await axiosi.patch(`/vesselOwners/${id}`, data, {
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

export const toggleVesselOwnerStatus = async (vesselOwnerId) => {
  try {
    const res = await axiosi.patch(
      `/vesselOwners/${vesselOwnerId}/toggle-status`,
    );
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
