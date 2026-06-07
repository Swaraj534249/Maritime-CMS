import { axiosi } from "../../config/axios";
import { rethrowApiError } from "../../config/apiHelpers";
import { normalizeListResponse } from "../../config/normalizeListResponse";

export const fetchVacancies = async (params = {}, signal) => {
  try {
    const res = await axiosi.get("/vacancies", { params, signal });
    return normalizeListResponse(res);
  } catch (error) {
    rethrowApiError(error);
  }
};

export const getVacancyById = async (id) => {
  try {
    const res = await axiosi.get(`/vacancies/${id}`);
    return res.data;
  } catch (error) {
    rethrowApiError(error);
  }
};

export const createVacancy = async (payload) => {
  try {
    const res = await axiosi.post("/vacancies", payload);
    return res.data;
  } catch (error) {
    rethrowApiError(error);
  }
};

export const updateVacancyById = async ({ id, ...payload }) => {
  try {
    const res = await axiosi.patch(`/vacancies/${id}`, payload);
    return res.data;
  } catch (error) {
    rethrowApiError(error);
  }
};

export const closeVacancy = async (id) => {
  try {
    const res = await axiosi.patch(`/vacancies/${id}/close`);
    return res.data;
  } catch (error) {
    rethrowApiError(error);
  }
};
