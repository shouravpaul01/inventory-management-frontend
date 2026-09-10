import z from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(1, "Email, username, or employee ID is required"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});



export const registerSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email"),

  category: z.string().min(1, "Category is required"),

  image: z.array(z.string()).min(1, "Profile image is required"),
  licence_image: z.array(z.string()).optional(),
  id_image: z.array(z.string()).min(1, "ID image is required"),
  id_with_image: z.array(z.string()).min(1, "ID with image is required"),

  password: z.string().min(6, "Password must be at least 6 characters"),
  confirm_password: z.string().nonempty("Confirm password is required."),
    isAgree: z.boolean(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
}).refine((data) => data.isAgree === true, {
    message: "You must accept Terms & Conditions",
    path: ["isAgree"],
  });



export const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().nonempty("Password is required").min(6, "Password must be at least 6 characters"),
    confirm: z.string().nonempty("Confirm password is required"),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });
