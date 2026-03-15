import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { resetPassword } from "@/services/publicService";
import { Lock, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InputField } from "../common";
import toast from "react-hot-toast";

export const ResetPasswordForm = ({ token }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const validatePassword = (password) => {
    if (!password.trim()) {
      return "Password is required";
    }
    if (password.length < 8) {
      return "Password must be at least 8 characters";
    }
    return null;
  };

  const validateConfirmPassword = (confirmPassword, password) => {
    if (!confirmPassword.trim()) {
      return "Please confirm your password";
    }
    if (confirmPassword !== password) {
      return "Passwords do not match";
    }
    return null;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }

    // Clear submit error
    if (submitError) {
      setSubmitError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate password
    const passwordError = validatePassword(formData.password);
    const confirmPasswordError = validateConfirmPassword(
      formData.confirmPassword,
      formData.password,
    );

    if (passwordError || confirmPasswordError) {
      setErrors({
        password: passwordError,
        confirmPassword: confirmPasswordError,
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    let toastId;

    try {
      toastId = toast.loading("Verifying...");
      const response = await resetPassword({
        token: token,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      if (response) {
        setSubmitSuccess(true);
        setFormData({ password: "", confirmPassword: "" });
        setTimeout(() => {
          navigate("/login");
        }, 5000);
      }
      toast.success("Reset Password success!", { id: toastId });
    } catch (error) {
      console.error("Reset password error:", error);
      setSubmitError(
        error.message ||
          "Failed to reset the password. Please try it again later.",
      );
      toast.error(
        error.message ||
          "Failed to reset the password. Please try it again later.",
        {
          id: toastId,
        },
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="space-y-6">
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <AlertDescription className="text-green-800 ml-2">
            <strong>Password has been changed!</strong>
            <p className="mt-2">
              You can login into your account with your new password.
            </p>
          </AlertDescription>
        </Alert>

        <Button
          type="button"
          onClick={() => navigate("/login")}
          className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white"
        >
          Go to login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {submitError && (
        <Alert variant="destructive">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <div className="relative">
        <InputField
          id="password"
          name="password"
          label="New Password"
          type={showPassword ? "text" : "password"}
          value={formData.password}
          onChange={handleChange}
          placeholder="Input new Password"
          isRequired={true}
          error={errors.password}
          onError={(error) =>
            setErrors((prev) => ({ ...prev, password: error }))
          }
          disabled={isSubmitting}
          validate={validatePassword}
          inputClassName="pl-10 pr-10 "
        />
        <div className="absolute left-3 top-11.5 text-gray-400 pointer-events-none">
          <Lock className="w-5 h-5" />
        </div>
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-11.5 text-gray-400 hover:text-gray-600"
        >
          {showPassword ?
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
            validateConfirmPassword(value, formData.password)
          }
          inputClassName="pl-10 pr-10 "
        />
        <div className="absolute left-3 top-11.5 text-gray-400 pointer-events-none">
          <Lock className="w-5 h-5" />
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
            Resetting...
          </>
        : "Submit"}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="text-sm hover:underline font-medium"
        >
          Back to Login
        </button>
      </div>
    </form>
  );
};
