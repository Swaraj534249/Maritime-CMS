import axios from "axios";

// export const axiosi=axios.create({withCredentials:true,baseURL:process.env.REACT_APP_BASE_URL})
export const axiosi = axios.create({
  withCredentials: true,
  baseURL: "http://localhost:8000",
});
// export const axiosi=axios.create({withCredentials:true,baseURL:'http://13.203.91.130:8000'})
