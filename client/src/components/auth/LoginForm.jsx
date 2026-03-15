import { useAuth } from "@/providers/AuthProvider";
import { Eye, EyeOff, LogIn, Mail, Lock } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InputField } from "../common";
import { Label } from "../ui/label";

export const LoginForm = () => {
  const [formData, setFormData] = useState({
    emailAddress: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (email) => {
    if (!email.trim()) {
      return "Email is required";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Email format is not valid";
    }
    return null;
  };

  const validatePassword = (password) => {
    if (!password.trim()) {
      return "Password is required";
    }
    if (password.length < 8) {
      return "Password must be at least 8 characters";
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
      setErrors((prev) => ({ ...prev, [name]: null }));
    }

    // Clear submit error
    if (submitError) {
      setSubmitError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate fields
    const emailError = validateEmail(formData.emailAddress);
    const passwordError = validatePassword(formData.password);

    if (emailError || passwordError) {
      setErrors({
        emailAddress: emailError,
        password: passwordError,
      });
      return;
    }

    setIsLoading(true);
    setSubmitError("");
    let toastId;

    try {
      toastId = toast.loading("Verifying..");
      await login(formData);
      toast.success("Login Successful!", { id: toastId });

      navigate("/", { replace: true });
    } catch (error) {
      console.error("Login failed:", error);
      const errorMessage =
        error.message || "Login failed. Please try it again later.";
      setSubmitError(errorMessage);
      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Error Alert */}
      {submitError && (
        <Alert variant="destructive">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      {/* Email Field */}
      <div className="relative">
        <InputField
          id="emailAddress"
          name="emailAddress"
          label="E-mail"
          type="email"
          value={formData.emailAddress}
          onChange={handleChange}
          placeholder="name@example.com"
          isRequired={true}
          error={errors.emailAddress}
          onError={(error) =>
            setErrors((prev) => ({ ...prev, emailAddress: error }))
          }
          disabled={isLoading}
          validate={validateEmail}
          inputClassName="pl-10"
          icon={Mail}
        />
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">
            Password <span className="text-red-500">*</span>
          </Label>
          <button
            type="button"
            onClick={() => navigate("/forgot-password")}
            className="text-sm font-medium hover:underline transition-colors"
          >
            Forgot password?
          </button>
        </div>
        <div className="relative">
          <InputField
            id="password"
            name="password"
            label="Password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleChange}
            placeholder="Input your password here"
            isRequired={true}
            error={errors.password}
            onError={(error) =>
              setErrors((prev) => ({ ...prev, password: error }))
            }
            disabled={isLoading}
            validate={validatePassword}
            inputClassName="pl-10 pr-10"
            labelClassName="hidden"
          />
          <div className="absolute left-3 top-3.5 text-gray-400 pointer-events-none">
            <Lock className="w-5 h-5" />
          </div>
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            {showPassword ?
              <EyeOff className="w-5 h-5" />
            : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-12 text-white font-medium text-base disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ?
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Loading...
          </>
        : <>
            <LogIn className="w-5 h-5 mr-2" />
            Login
          </>
        }
      </Button>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or</span>
        </div>
      </div>

      {/* Sign Up Link */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Doesn&apos;t have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="font-semibold hover:underline transition-colors"
          >
            Register Now
          </button>
        </p>
      </div>
    </form>
  );
};
