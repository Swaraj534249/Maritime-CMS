import { axiosi } from "../../config/axios";
import { rethrowApiError } from "../../config/apiHelpers";
import { normalizeListResponse } from "../../config/normalizeListResponse";

export const fetchDocumentations = async (params = {}, signal) => {
  try {
    const res = await axiosi.get("/documentation", { params, signal });
    return normalizeListResponse(res);
  } catch (error) {
    rethrowApiError(error);
  }
};

export const getDocumentationById = async (id) => {
  try {
    const res = await axiosi.get(`/documentation/${id}`);
    return res.data;
  } catch (error) {
    rethrowApiError(error);
  }
};

export const verifyDocument = async ({ id, ...payload }) => {
  try {
    const res = await axiosi.patch(
      `/documentation/${id}/verify-document`,
      payload,
    );
    return res.data;
  } catch (error) {
    rethrowApiError(error);
  }
};
