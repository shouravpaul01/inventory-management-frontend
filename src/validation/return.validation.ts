import z from "zod";

export const returnLineSchema = z.object({
  inventoryItemId: z.string().min(1, "Item is required"),
  inventoryUnitId: z.string().optional(),
  destinationLocationId: z.string().min(1, "Destination location is required"),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  condition: z.enum(["SAME", "GOOD", "DAMAGED", "LOST", "NEEDS_REPAIR"]),
  remarks: z.string().optional(),
});

export const processReturnSchema = z.object({
  distributionId: z.string().min(1, "Distribution reference is required"),
  status: z.enum(["EXPECTED", "PARTIALLY_RETURNED", "RETURNED", "OVERDUE", "LOST"]),
  remarks: z.string().optional(),
  lines: z.array(returnLineSchema).min(1, "Must return at least one item line"),
});

export type TReturnLineInput = z.infer<typeof returnLineSchema>;
export type TProcessReturnInput = z.infer<typeof processReturnSchema>;
