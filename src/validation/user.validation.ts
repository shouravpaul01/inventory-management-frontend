import z from "zod";

export const createUserSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .transform((v) => v.trim().toLowerCase()),
  email: z.string().min(1, "Email is required").email("Valid email is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  departmentId: z.string().min(1, "Department assignment is required"),
  password: z
    .string()
    .min(6, "Initial password must be at least 6 characters"),
  roleIds: z.array(z.string()).optional(),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  departmentId: z.string().min(1, "Department assignment is required"),
  roleIds: z.array(z.string()).optional(),
});

export type TCreateUserInput = z.infer<typeof createUserSchema>;
export type TUpdateUserInput = z.infer<typeof updateUserSchema>;
