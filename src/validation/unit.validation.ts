import z from "zod";

export const createUnitSchema = z.object({
  inventoryItemId: z.string().min(1, "Inventory Item selection is required"),
  uniqueCode: z.string().optional(),
  serialNumber: z.string().optional(),
  barcode: z.string().optional(),
  condition: z.enum(["NEW", "GOOD", "FAIR", "POOR", "DAMAGED"]),
  locationId: z.string().optional(),
  purchaseDate: z.string().optional(),
  warrantyEndDate: z.string().optional(),
  notes: z.string().optional(),
});

export const batchCreateUnitSchema = z.object({
  inventoryItemId: z.string().min(1, "Inventory Item selection is required"),
  count: z.number().int().min(1, "At least 1 unit").max(100, "Maximum 100 units per batch"),
  locationId: z.string().optional(),
  condition: z.enum(["NEW", "GOOD", "FAIR", "POOR", "DAMAGED"]),
  notes: z.string().optional(),
  purchaseDate: z.string().optional(),
  warrantyEndDate: z.string().optional(),
});

export const updateUnitSchema = z.object({
  serialNumber: z.string().optional(),
  barcode: z.string().optional(),
  condition: z.enum(["NEW", "GOOD", "FAIR", "POOR", "DAMAGED"]).optional(),
  locationId: z.string().optional(),
  notes: z.string().optional(),
  warrantyEndDate: z.string().optional(),
});

export type TCreateUnitInput = z.infer<typeof createUnitSchema>;
export type TBatchCreateUnitInput = z.infer<typeof batchCreateUnitSchema>;
export type TUpdateUnitInput = z.infer<typeof updateUnitSchema>;
