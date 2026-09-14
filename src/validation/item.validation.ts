import z from "zod";

export const itemFormSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  code: z.string().optional(),
  sku: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  brand: z.string().optional(),
  model: z.string().optional(),
  trackingType: z.enum(["SERIALIZED", "BULK"]),
  isReturnable: z.boolean(),
  defaultIssuePolicy: z.enum(["PERMANENT", "TEMPORARY", "GIFT"]),
  unitName: z.string().min(1, "Unit of measure is required"),
  minimumStock: z.number().min(0),
  reorderLevel: z.number().min(0),
  description: z.string().optional(),
});

export type TItemFormInput = z.infer<typeof itemFormSchema>;
