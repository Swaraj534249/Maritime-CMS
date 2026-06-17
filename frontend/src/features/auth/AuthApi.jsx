import { axiosi } from "../../config/axios";
import { rethrowApiError } from "../../config/apiHelpers";

export const signup = async (cred) => {
  try {
    const res = await axiosi.post("auth/signup", cred);
    return res.data;
  } catch (error) {
    rethrowApiError(error);
  }
};

export const login = async (cred) => {
  try {
    const res = await axiosi.post("auth/login", cred);
    return res.data;
  } catch (error) {
    rethrowApiError(error);
  }
};

export const verifyOtp = async (cred) => {
  try {
    const res = await axiosi.post("auth/verify-otp", cred);
    return res.data;
  } catch (error) {
    rethrowApiError(error);
  }
};

export const resendOtp = async (cred) => {
  try {
    const res = await axiosi.post("auth/resend-otp", cred);
    return res.data;
  } catch (error) {
    rethrowApiError(error);
  }
};

export const forgotPassword = async (cred) => {
  try {
    const res = await axiosi.post("auth/forgot-password", cred);
    return res.data;
  } catch (error) {
    rethrowApiError(error);
  }
};

export const resetPassword = async (cred) => {
  try {
    const res = await axiosi.post("auth/reset-password", cred);
    return res.data;
  } catch (error) {
    rethrowApiError(error);
  }
};

export const checkAuth = async () => {
  try {
    const res = await axiosi.get("auth/check-auth");
    return res.data;
  } catch (error) {
    rethrowApiError(error);
  }
};

export const logout = async () => {
  try {
    const res = await axiosi.get("auth/logout");
    return res.data;
  } catch (error) {
    rethrowApiError(error);
  }
};
