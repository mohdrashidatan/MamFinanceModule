import api from "@/utils/api";
import { handleServiceError } from "../utils/errorHandler";

export const registerMember = async (memberData) => {
  try {
    const response = await api.post("/api/auth/register", memberData);

    return response.data;
  } catch (error) {
    console.error("registration error: ", error);
    handleServiceError(error, "Registration failed");
  }
};

export const forgotPassword = async (memberData) => {
  try {
    const response = await api.post("/api/auth/forgot-password", memberData);

    return response.data;
  } catch (error) {
    console.error("Forgot password error: ", error);
    handleServiceError(error, "Forgot password failed");
  }
};

export const resetPassword = async (memberData) => {
  try {
    const response = await api.post("/api/auth/reset-password", memberData);

    return response.data;
  } catch (error) {
    console.error("Reset password error: ", error);
    handleServiceError(error, "Reset password failed");
  }
};

export const updateCurrentPassword = async (formData) => {
  console.log("submit: ", formData);
};
