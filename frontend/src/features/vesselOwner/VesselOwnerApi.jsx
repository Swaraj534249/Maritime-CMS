import { axiosi } from "../../config/axios";
import {
  entityIdFromPayload,
  multipartHeaders,
  rethrowApiError,
} from "../../config/apiHelpers";
import { normalizeListResponse } from "../../config/normalizeListResponse";

export const createVesselOwner = async (data) => {
  try {
    const res = await axiosi.post("/vesselOwners", data, {
      headers: multipartHeaders(data),
    });
    return res.data;
  } catch (error) {
    rethrowApiError(error);
  }
};

export const getVesselOwnerById = async (id) => {
  try {
    const res = await axiosi.get(`/vesselOwners/${id}`);
    return res.data;
  } catch (error) {
    rethrowApiError(error);
  }
};

export const fetchVesselOwners = async (params = {}, signal) => {
  try {
    const res = await axiosi.get("/vesselOwners", { params, signal });
    return normalizeListResponse(res);
  } catch (error) {
    rethrowApiError(error);
  }
};

export const updateVesselOwnerById = async (data) => {
  try {
    const id = entityIdFromPayload(data);
    const res = await axiosi.patch(`/vesselOwners/${id}`, data, {
      headers: multipartHeaders(data),
    });
    return res.data;
  } catch (error) {
    rethrowApiError(error);
  }
};

export const toggleVesselOwnerStatus = async (vesselOwnerId) => {
  try {
    const res = await axiosi.patch(
      `/vesselOwners/${vesselOwnerId}/toggle-status`,
    );
    return res.data;
  } catch (error) {
    rethrowApiError(error);
  }
};
