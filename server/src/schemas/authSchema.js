const { z } = require("zod");

const emailSchema = z
  .email("Invalid email format")
  .trim()
  .toLowerCase()
  .min(1, "Email address is required")
  .max(50, "Email address is too long");

const passwordSchema = z
  .string("Password is required")
  .trim()
  .min(6, "Password must be at least 6 characters long")
  .max(100, "Password is too long");

const nameSchema = z
  .string("Name is required")
  .trim()
  .min(1, "Name is required")
  .max(255, "Name is too long");

const loginSchema = z.object({
  emailAddress: emailSchema,
  password: passwordSchema,
});

const registrationSchema = z
  .object({
    emailAddress: emailSchema,
    password: passwordSchema,
    confirmPassword: passwordSchema,
    name: nameSchema,
    phone: z
      .string()
      .trim()
      .max(20, "Phone number is too long")
      .regex(/^[\+]?[0-9\s\-\(\)]+$/, "Invalid phone number format")
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

module.exports = {
  loginSchema,
  registrationSchema,
};
