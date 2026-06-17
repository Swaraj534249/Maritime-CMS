import { axiosi } from "../../config/axios";
import { multipartHeaders, rethrowApiError } from "../../config/apiHelpers";
import { normalizeListResponse } from "../../config/normalizeListResponse";

export const submitFeedback = async (formData) => {
  try {
    const res = await axiosi.post("/feedbacks", formData, {
      headers: multipartHeaders(formData),
    });
    return res.data;
  } catch (error) {
    rethrowApiError(error);
  }
};

export const fetchFeedbacks = async (params = {}, signal) => {
  try {
    const res = await axiosi.get("/feedbacks", { params, signal });
    return normalizeListResponse(res);
  } catch (error) {
    rethrowApiError(error);
  }
};

export const getFeedbackById = async (id) => {
  try {
    const res = await axiosi.get(`/feedbacks/${id}`);
    return res.data;
  } catch (error) {
    rethrowApiError(error);
  }
};

export const updateFeedbackById = async ({ id, formData }) => {
  try {
    const res = await axiosi.patch(`/feedbacks/${id}`, formData, {
      headers: multipartHeaders(formData),
    });
    return res.data;
  } catch (error) {
    rethrowApiError(error);
  }
};
