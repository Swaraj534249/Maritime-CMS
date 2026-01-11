import { axiosi } from "../../config/axios";
import { normalizeListResponse } from "../../config/normalizeListResponse";

export const createAgent = async (data) => {
  try {
    const res = await axiosi.post("/agents", data);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getAgentById = async (id) => {
  try {
    const res = await axiosi.get(`/agents/${id}`);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const fetchAgents = async (params = {}, signal) => {
  try {
    const res = await axiosi.get("/agents", { params, signal });
    return normalizeListResponse(res);
  } catch (error) {
    if (error.name === "CanceledError" || error.code === "ERR_CANCELED") {
      throw error;
    }
    throw error.response?.data ?? error;
  }
};

export const updateAgentById = async ({ id, data }) => {
  try {
    const res = await axiosi.patch(`/agents/${id}`, data);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const toggleAgentStatus = async (agentId) => {
  try {
    const res = await axiosi.patch(`/agents/${agentId}/toggle-status`);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const resetAgentPassword = async ({ id, newPassword }) => {
  try {
    const res = await axiosi.post(`/agents/${id}/reset-password`, {
      newPassword,
    });
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
