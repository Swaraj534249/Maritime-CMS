import axios from "axios";

// API base URL comes only from the environment. CRA loads .env.development for
// `npm start` and .env.production for `npm run build`. REACT_APP_BASE_URL is kept
// as a backward-compatible alias for older local env files.
export function getApiBaseUrl() {
  return process.env.REACT_APP_API_URL || process.env.REACT_APP_BASE_URL;
}

export const axiosi = axios.create({
  withCredentials: true,
  baseURL: getApiBaseUrl(),
});
