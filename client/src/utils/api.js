import axios from "axios";
import { authService } from "../services/authService";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// REQUEST INTERCEPTOR
api.interceptors.request.use((config) => {
  const isPublicRoute =
    config.url.includes("/auth/login") ||
    config.url.includes("/auth/register") ||
    config.url.includes("/auth/forgot-password") ||
    config.url.includes("/auth/reset-password");

  const token = authService.getToken();

  if (!isPublicRoute && token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  },
);

export default api;
