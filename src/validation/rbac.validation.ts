import z from "zod";

export const roleFormSchema = z.object({
  name: z.string().min(1, "Role name is required"),
  code: z
    .string()
    .min(1, "Role code is required")
    .transform((v) => v.trim().toUpperCase()),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).optional(),
});

export type TRoleFormInput = z.infer<typeof roleFormSchema>;
