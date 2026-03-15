import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import api from "@/utils/api";
import { handleServiceError } from "@/utils/errorHandler";

export const authService = {
  getToken: () => {
    return Cookies.get("token");
  },

  setToken: (token) => {
    Cookies.set("token", token, {
      expires: 1,
      secure: true,
      sameSite: "Strict",
    });
  },

  removeToken: () => {
    Cookies.remove("token");
  },

  isAuthenticated: () => {
    const token = authService.getToken();
    if (!token) return false;

    try {
      const decoded = jwtDecode(token);

      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        authService.removeToken();
        return false;
      }

      if (!decoded.userId || !decoded.iat || !decoded.jti) {
        authService.removeToken();
        return false;
      }

      return true;
    } catch {
      authService.removeToken();
      return false;
    }
  },

  getUser: () => {
    try {
      const token = authService.getToken();
      if (!token) return null;

      const decoded = jwtDecode(token);
      return {
        userId: decoded.userId,
        userName: decoded.userName,
        email: decoded.email,
        ...decoded,
      };
    } catch {
      return null;
    }
  },

  login: async (credentials) => {
    try {
      const response = await api.post("/api/auth/login", credentials);

      const token = response.data.data.token;
      authService.setToken(token);

      const user = authService.getUser();

      return {
        success: true,
        user,
        token,
        ...response.data,
      };
    } catch (error) {
      authService.removeToken();
      handleServiceError(error, "Login failed");
      throw error;
    }
  },

  logout: async () => {
    try {
      authService.removeToken();

      return { success: true };
    } catch (error) {
      authService.removeToken();
      handleServiceError(error, "Logout failed");
      throw error;
    }
  },

  refreshToken: async () => {
    try {
      const response = await api.post("/api/auth/refresh");
      const token = response.data.data.token;

      authService.setToken(token);

      return {
        success: true,
        token,
        user: authService.getUser(),
      };
    } catch (error) {
      authService.removeToken();
      handleServiceError(error, "Token refresh failed");
      throw error;
    }
  },

  validateAndGetUser: () => {
    if (authService.isAuthenticated()) {
      return authService.getUser();
    }
    return null;
  },

  register: async (userData) => {
    try {
      const response = await api.post("/api/auth/register", userData);
      return response.data;
    } catch (error) {
      handleServiceError(error, "Registration failed");
      throw error;
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await api.post("/api/auth/forgot-password", { email });
      return response.data;
    } catch (error) {
      handleServiceError(error, "Password reset request failed");
      throw error;
    }
  },

  resetPassword: async (resetData) => {
    try {
      const response = await api.post("/api/auth/reset-password", resetData);
      return response.data;
    } catch (error) {
      handleServiceError(error, "Password reset failed");
      throw error;
    }
  },

  getTokenExpiry: () => {
    try {
      const token = authService.getToken();
      if (!token) return null;

      const decoded = jwtDecode(token);
      return decoded.exp ? decoded.exp * 1000 : null;
    } catch {
      return null;
    }
  },

  getTimeUntilExpiry: () => {
    const expiresAt = authService.getTokenExpiry();
    if (!expiresAt) return null;

    const timeRemaining = expiresAt - Date.now();
    return timeRemaining > 0 ? timeRemaining : 0;
  },

  isTokenExpired: () => {
    const expiresAt = authService.getTokenExpiry();
    if (!expiresAt) return true;

    return Date.now() >= expiresAt;
  },

  getTokenExpiryDate: () => {
    const expiresAt = authService.getTokenExpiry();
    return expiresAt ? new Date(expiresAt) : null;
  },
};
