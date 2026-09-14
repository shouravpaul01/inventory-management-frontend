import z from "zod";

export const departmentFormSchema = z.object({
  name: z.string().min(1, "Department name is required"),
  code: z
    .string()
    .min(1, "Department code is required")
    .transform((val) => val.trim().toUpperCase()),
  description: z.string().optional(),
});

export const createDepartmentSchema = departmentFormSchema;
export const updateDepartmentSchema = departmentFormSchema.partial();

export type TDepartmentFormInput = z.infer<typeof departmentFormSchema>;
export type TCreateDepartmentInput = TDepartmentFormInput;
export type TUpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
