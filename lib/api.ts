import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000", // Pointing to your FastAPI backend
});

// Automatically add the token to every request if we have one
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;