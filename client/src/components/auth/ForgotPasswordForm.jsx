import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { forgotPassword } from "@/services/publicService";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InputField } from "../common";
import toast from "react-hot-toast";

export const ForgotPasswordForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    emailAddress: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const validateEmail = (email) => {
    if (!email.trim()) {
      return "Email is required";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailError = validateEmail(formData.emailAddress);
    if (emailError) {
      setErrors({ emailAddress: emailError });
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    let toastId;

    try {
      toastId = toast.loading("Verifying...");
      const response = await forgotPassword({
        emailAddress: formData.emailAddress.trim(),
      });

      if (response) {
        setSubmitSuccess(true);
        setFormData({ emailAddress: "" });
      }
      toast.success("Email has been sended!", { id: toastId });
    } catch (error) {
      console.error("Forgot password error:", error);
      setSubmitError(error.message || "Failed, Please try it again later.");
      toast.error(error.message || "Failed, Please try it again later.", {
        id: toastId,
      });
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
            <strong>Email has been sended!</strong>
            <p className="mt-2">
              Please open your email for verification. If you don&apos;t
              received it after a few minutes, Please check your spam email.
            </p>
          </AlertDescription>
        </Alert>

        <Button
          type="button"
          onClick={() => navigate("/login")}
          className="w-full h-12 text-white"
        >
          Back to login
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
          id="emailAddress"
          name="emailAddress"
          label="Email"
          type="email"
          value={formData.emailAddress}
          onChange={handleChange}
          placeholder="contoh@email.com"
          isRequired={true}
          error={errors.emailAddress}
          onError={(error) =>
            setErrors((prev) => ({ ...prev, emailAddress: error }))
          }
          disabled={isSubmitting}
          validate={validateEmail}
          inputClassName="pl-10"
          icon={Mail}
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-12 text-white font-medium text-base disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ?
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Verifying...
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
