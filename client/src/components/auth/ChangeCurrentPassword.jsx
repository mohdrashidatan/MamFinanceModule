import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Lock, Loader2, Eye, EyeOff, KeyRound } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InputField } from "../common";
import { ConfirmationModal } from "../common/ConfirmationModal";
import toast from "react-hot-toast";
import { useAuth } from "@/providers/AuthProvider";
import { Navigate } from "react-router-dom";
import { updateCurrentPassword } from "@/services/publicService";

export const ChangeCurrentPassword = () => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const { logout } = useAuth();
  const [errors, setErrors] = useState({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);

  const validateCurrentPassword = (password) => {
    if (!password.trim()) {
      return "Current password is required";
    }
    return null;
  };

  const validateNewPassword = (password, currentPassword) => {
    if (!password.trim()) {
      return "New Password is required";
    }
    if (password.length < 8) {
      return "Password must be at least 8 characters";
    }
    if (password === currentPassword) {
      return "New Password can't be same as current password";
    }
    return null;
  };

  const validateConfirmPassword = (confirmPassword, newPassword) => {
    if (!confirmPassword.trim()) {
      return "Confirm your new password";
    }
    if (confirmPassword !== newPassword) {
      return "Password must be same as New Password";
    }
    return null;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }

    if (submitError) {
      setSubmitError("");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const currentPasswordError = validateCurrentPassword(
      formData.currentPassword,
    );
    const newPasswordError = validateNewPassword(
      formData.newPassword,
      formData.currentPassword,
    );
    const confirmPasswordError = validateConfirmPassword(
      formData.confirmPassword,
      formData.newPassword,
    );

    if (currentPasswordError || newPasswordError || confirmPasswordError) {
      setErrors({
        currentPassword: currentPasswordError,
        newPassword: newPasswordError,
        confirmPassword: confirmPasswordError,
      });
      return;
    }

    // Show confirmation modal
    setShowConfirmModal(true);
  };

  const handleConfirmPasswordChange = async () => {
    setShowConfirmModal(false);
    setConfirmChecked(false);
    setIsSubmitting(true);
    setSubmitError("");
    let toastId;
    try {
      toastId = toast.loading("Updating password...");
      const response = await updateCurrentPassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });

      if (response) {
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        toast.success("Password successfully changed!", { id: toastId });

        setTimeout(() => {
          logout();
          toast.success(
            "Please re authenticated your session with your new password",
          );
          Navigate("/");
        }, 2000);
      }
    } catch (error) {
      console.error("Change password error:", error);
      toast.error(error.message || "Failed to change the password.", {
        id: toastId,
      });

      if (error.message?.includes("current password")) {
        setErrors({ currentPassword: "Current password is not correct" });
      } else {
        setSubmitError(error.message || "Failed to change the password.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowConfirmModal(false);
    setConfirmChecked(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        {submitError && (
          <Alert variant="destructive">
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <div className="relative">
          <InputField
            id="currentPassword"
            name="currentPassword"
            label="Current Password"
            type={showCurrentPassword ? "text" : "password"}
            value={formData.currentPassword}
            onChange={handleChange}
            placeholder="Enter your password"
            isRequired={true}
            error={errors.currentPassword}
            onError={(error) =>
              setErrors((prev) => ({ ...prev, currentPassword: error }))
            }
            disabled={isSubmitting}
            validate={validateCurrentPassword}
            inputClassName="pl-10 pr-10"
          />
          <div className="absolute left-3 top-11.5 text-gray-400 pointer-events-none">
            <Lock className="w-5 h-5" />
          </div>
          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className="absolute right-3 top-11.5 text-gray-400 hover:text-gray-600"
          >
            {showCurrentPassword ?
              <EyeOff className="w-5 h-5" />
            : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <div className="relative">
          <InputField
            id="newPassword"
            name="newPassword"
            label="New Password"
            type={showNewPassword ? "text" : "password"}
            value={formData.newPassword}
            onChange={handleChange}
            placeholder="Enter your new password"
            isRequired={true}
            error={errors.newPassword}
            onError={(error) =>
              setErrors((prev) => ({ ...prev, newPassword: error }))
            }
            disabled={isSubmitting}
            validate={(value) =>
              validateNewPassword(value, formData.currentPassword)
            }
            inputClassName="pl-10 pr-10"
          />
          <div className="absolute left-3 top-11.5 text-gray-400 pointer-events-none">
            <KeyRound className="w-5 h-5" />
          </div>
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-11.5 text-gray-400 hover:text-gray-600"
          >
            {showNewPassword ?
              <EyeOff className="w-5 h-5" />
            : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <div className="relative">
          <InputField
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm Password"
            type={showConfirmPassword ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm your new password"
            isRequired={true}
            error={errors.confirmPassword}
            onError={(error) =>
              setErrors((prev) => ({ ...prev, confirmPassword: error }))
            }
            disabled={isSubmitting}
            validate={(value) =>
              validateConfirmPassword(value, formData.newPassword)
            }
            inputClassName="pl-10 pr-10"
          />
          <div className="absolute left-3 top-11.5 text-gray-400 pointer-events-none">
            <KeyRound className="w-5 h-5" />
          </div>
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-11.5 text-gray-400 hover:text-gray-600"
          >
            {showConfirmPassword ?
              <EyeOff className="w-5 h-5" />
            : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 text-white font-medium text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ?
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Submitting...
            </>
          : "Submit"}
        </Button>
      </form>

      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={handleCloseModal}
        title="Change Password Confirmation"
        message="Are you sure want to change your password? Anda perlu log masuk semula selepas ini."
        onConfirm={handleConfirmPasswordChange}
        isLoading={isSubmitting}
        confirmCheckbox={{
          checked: confirmChecked,
          onChange: setConfirmChecked,
          label: "Saya faham dan ingin meneruskan perubahan password",
        }}
      />
    </>
  );
};
