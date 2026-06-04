import { axiosi } from "../../config/axios";
import {
  entityIdFromPayload,
  multipartHeaders,
  rethrowApiError,
} from "../../config/apiHelpers";
import { normalizeListResponse } from "../../config/normalizeListResponse";

export const createVessel = async (data) => {
  try {
    const res = await axiosi.post("/vessels", data, {
      headers: multipartHeaders(data),
    });
    return res.data;
  } catch (error) {
    rethrowApiError(error);
  }
};

export const getVesselById = async (id) => {
  try {
    const res = await axiosi.get(`/vessels/${id}`);
    return res.data;
  } catch (error) {
    rethrowApiError(error);
  }
};

export const fetchVessels = async (params = {}, signal) => {
  try {
    const res = await axiosi.get("/vessels", { params, signal });
    return normalizeListResponse(res);
  } catch (error) {
    rethrowApiError(error);
  }
};

export const updateVesselById = async (data) => {
  try {
    const id = entityIdFromPayload(data);
    const res = await axiosi.patch(`/vessels/${id}`, data, {
      headers: multipartHeaders(data),
    });
    return res.data;
  } catch (error) {
    rethrowApiError(error);
  }
};

export const toggleVesselStatus = async (vesselId) => {
  try {
    const res = await axiosi.patch(`/vessels/${vesselId}/toggle-status`);
    return res.data;
  } catch (error) {
    rethrowApiError(error);
  }
};
