import { axiosi } from "../../config/axios";
import { normalizeListResponse } from "../../config/normalizeListResponse";

export const createVessel = async (data) => {
  try {
    const isFormData = data instanceof FormData;
    const res = await axiosi.post("/vessels", data, {
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

export const getVesselByUserId = async (id) => {
  try {
    const res = await axiosi.get(`/vessels/user/${id}`);
    return res.data;
  } catch (error) {
    throw error.response?.data ?? error;
  }
};

export const getAllVessels = async (params = {}, signal) => {
  try {
    const res = await axiosi.get("/vessels", { params, signal });
    return normalizeListResponse(res);
  } catch (error) {
    if (error.name === "CanceledError" || error.code === "ERR_CANCELED") {
      throw error;
    }
    throw error.response?.data ?? error;
  }
};

export const fetchVesselByVesselOwnerId = async (id) => {
  try {
    const res = await axiosi.get(`/vessels/vesselOwner/${id}`);
    return res.data;
  } catch (error) {
    throw error.response?.data ?? error;
  }
};

export const updateVesselById = async (data) => {
  try {
    const isFormData = data instanceof FormData;
    const id = isFormData ? data.get("_id") : data._id;
    //   payload.delete('_id')
    const res = await axiosi.patch(`/vessels/${id}`, data, {
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
