import { axiosi } from "../../../config/axios";
import { rethrowApiError } from "../../../config/apiHelpers";
import { normalizeListResponse } from "../../../config/normalizeListResponse";

export const fetchVesselTypes = async (params = {}, signal) => {
  try {
    const res = await axiosi.get("/vesselTypes", { params, signal });
    return normalizeListResponse(res);
  } catch (error) {
    rethrowApiError(error);
  }
};

export const createVesselType = async (payload) => {
  try {
    const res = await axiosi.post("/vesselTypes", payload);
    return res.data;
  } catch (error) {
    rethrowApiError(error);
  }
};

export const updateVesselType = async ({ id, ...payload }) => {
  try {
    const res = await axiosi.patch(`/vesselTypes/${id}`, payload);
    return res.data;
  } catch (error) {
    rethrowApiError(error);
  }
};

export const toggleVesselTypeStatus = async (id) => {
  try {
    const res = await axiosi.patch(`/vesselTypes/${id}/toggle-status`);
    return res.data;
  } catch (error) {
    rethrowApiError(error);
  }
};
