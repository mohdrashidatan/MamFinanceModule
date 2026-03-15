import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InputField } from "../common";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
// import { useUser } from "@/hooks/useUsers";

export const ResetUserPassword = ({ isOpen = false, onOpenChange, userId }) => {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // const { resetUserPassword, isSubmitting } = useUser();
  const [submitError, setSubmitError] = useState("");
  let isSubmitting = false;

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        password: "",
        confirmPassword: "",
      });
      setErrors({});
      setShowPassword(false);
      setShowConfirmPassword(false);
      setSubmitError("");
    }
  }, [isOpen]);

  const validatePassword = (password) => {
    if (!password.trim()) {
      return "Password is required";
    }
    if (password.length < 6) {
      return "Password must be at least 6 characters";
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
    setSubmitError("");

    try {
      // await resetUserPassword(userId, {
      //   password: formData.password,
      //   confirmPassword: formData.confirmPassword,
      // });
      onOpenChange(false);
    } catch (error) {
      console.error("Reset password error:", error);
      setSubmitError(
        error.message || "Internal Server Error. Please try it again later.",
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gray-700">
            Reset User Password
          </DialogTitle>
          <DialogDescription>Reset Current User Password</DialogDescription>
        </DialogHeader>
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
              label="Confirm New Password"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Input Confirm New Password"
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

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-gray-700 font-medium text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ?
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Resetting...
                </>
              : "Submit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
