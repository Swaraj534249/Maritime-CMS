import axios from "axios";

export function getApiBaseUrl() {
  return (
    process.env.REACT_APP_API_URL ||
    process.env.REACT_APP_BASE_URL ||
    "https://api.tursaile.in"
  );
}

export const axiosi = axios.create({
  withCredentials: true,
  baseURL: getApiBaseUrl(),
});
