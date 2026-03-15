import { createContext, useContext, useEffect, useRef, useState } from "react";
import { authService } from "@/services/authService";
import api from "@/utils/api";

const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState([]);
  const logoutTimerRef = useRef(null);

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setPermissions([]);
  };

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    if (response.success) {
      setUser(response.user);
      setPermissions(response.permissions || []);
    }

    return response;
  };

  const hasPermission = (resource, action) => {
    console.log("Check permission: ", resource, action);
    return permissions.some(
      (p) => p.resource_code === resource && p.action === action,
    );
  };

  useEffect(() => {
    const initializeAuth = () => {
      const validUser = authService.validateAndGetUser();
      if (validUser) {
        setUser(validUser);
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    const setupAutoLogout = () => {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
        logoutTimerRef.current = null;
      }

      const token = authService.getToken();
      if (!token) return;

      if (authService.isTokenExpired()) {
        logout();
        window.location.href = "/login";
        return;
      }

      const timeUntilExpiry = authService.getTimeUntilExpiry();
      if (timeUntilExpiry === null || timeUntilExpiry <= 0) {
        logout();
        window.location.href = "/login";
        return;
      }

      logoutTimerRef.current = setTimeout(() => {
        logout();
        window.location.href = "/login";
      }, timeUntilExpiry);

      console.log(
        `Auto logout scheduled in ${Math.round(timeUntilExpiry / 1000)} seconds`,
      );
    };

    setupAutoLogout();

    return () => {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }
    };
  }, [user]);

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (res) => res,
      (error) => {
        const status = error?.response?.status;
        const code = error?.response?.data?.error?.code;
        const msg = error?.response?.data?.error?.message;

        const isTokenExpired =
          (status === 401 && code === "TOKEN_EXPIRED") ||
          msg === "Access token required";
        const isInvalidToken = status === 403 && code === "INVALID_TOKEN";

        if (isTokenExpired || isInvalidToken) {
          authService.removeToken();
          setUser(null);
          setPermissions([]);

          setTimeout(() => {
            window.location.href = "/login";
          }, 100);
        }

        return Promise.reject(error);
      },
    );

    return () => api.interceptors.response.eject(interceptor);
  }, []);

  const contextValue = {
    user,
    login,
    logout,
    loading,
    hasPermission,
    permissions,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
