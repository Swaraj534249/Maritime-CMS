import { axiosi } from "../../config/axios";
import { normalizeListResponse } from "../../config/normalizeListResponse";

export const submitFeedback = async (formData) => {
  try {
    const res = await axiosi.post("/feedbacks", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const fetchFeedbacks = async (params = {}, signal) => {
  try {
    const res = await axiosi.get("/feedbacks", { params, signal });
    return normalizeListResponse(res);
  } catch (error) {
    if (error.name === "CanceledError" || error.code === "ERR_CANCELED") {
      throw error;
    }
    throw error.response?.data ?? error;
  }
};

export const getFeedbackById = async (id) => {
  try {
    const res = await axiosi.get(`/feedbacks/${id}`);
    return res.data;
  } catch (error) {
    throw error.response?.data ?? error;
  }
};

export const updateFeedbackById = async ({ id, formData }) => {
  try {
    const res = await axiosi.patch(`/feedbacks/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (error) {
    throw error.response?.data ?? error;
  }
};
