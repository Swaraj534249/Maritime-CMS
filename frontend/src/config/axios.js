import axios from "axios";

export function getApiBaseUrl() {
  return (
    process.env.REACT_APP_API_URL ||
    process.env.REACT_APP_BASE_URL ||
    "http://localhost:8000"
  );
}

export const axiosi = axios.create({
  withCredentials: true,
  baseURL: getApiBaseUrl(),
});
