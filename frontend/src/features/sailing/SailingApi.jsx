import { axiosi } from "../../config/axios";
import { rethrowApiError } from "../../config/apiHelpers";
import { normalizeListResponse } from "../../config/normalizeListResponse";

export const fetchSailings = async (params = {}, signal) => {
  try {
    const res = await axiosi.get("/sailings", { params, signal });
    return normalizeListResponse(res);
  } catch (error) {
    rethrowApiError(error);
  }
};

// Finalize a documentation record into a sailing (sign the candidate on).
export const finalizeSailing = async ({ documentationId }) => {
  try {
    const res = await axiosi.post("/sailings", { documentationId });
    return res.data;
  } catch (error) {
    rethrowApiError(error);
  }
};

export const signOffSailing = async ({ id, ...payload }) => {
  try {
    const res = await axiosi.patch(`/sailings/${id}/sign-off`, payload);
    return res.data;
  } catch (error) {
    rethrowApiError(error);
  }
};
