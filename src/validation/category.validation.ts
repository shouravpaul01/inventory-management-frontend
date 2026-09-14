import z from "zod";

export const categoryFormSchema = z.object({
  name: z.string().min(1, "Category name is required"),
  code: z
    .string()
    .min(1, "Category code is required")
    .transform((val) => val.trim().toUpperCase()),
  description: z.string().optional(),
  parentId: z.string().optional(),
});

export const createCategorySchema = categoryFormSchema;
export const updateCategorySchema = categoryFormSchema.partial();

export type TCategoryFormInput = z.infer<typeof categoryFormSchema>;
export type TCreateCategoryInput = TCategoryFormInput;
export type TUpdateCategoryInput = z.infer<typeof updateCategorySchema>;
