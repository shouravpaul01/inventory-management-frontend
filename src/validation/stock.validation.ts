import z from "zod";

export const unitIntakeItemSchema = z.object({
  uniqueCode: z.string().optional(),
  serialNumber: z.string().optional(),
  condition: z.enum(["NEW", "GOOD", "FAIR", "DAMAGED"]).optional(),
  warrantyEndDate: z.string().optional(),
  purchaseDate: z.string().optional(),
  notes: z.string().optional(),
});

export const stockInSchema = z.object({
  inventoryItemId: z.string().min(1, "Inventory item is required"),
  locationId: z.string().min(1, "Stock location is required"),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  type: z.enum(["PURCHASE", "STOCK_IN", "INITIAL_STOCK"]),
  notes: z.string().optional(),
  autoGenerateCodes: z.boolean().optional(),
  units: z.array(unitIntakeItemSchema).optional(),
});

export const stockOutSchema = z.object({
  inventoryItemId: z.string().min(1, "Inventory item is required"),
  locationId: z.string().min(1, "Stock location is required"),
  quantity: z.number().int().positive("Quantity must be at least 1").optional(),
  unitIds: z.array(z.string()).optional(),
  type: z.enum(["STOCK_OUT", "DAMAGE", "LOSS", "DISPOSAL", "GIFT"]),
  notes: z.string().optional(),
});

export const stockTransferSchema = z.object({
  inventoryItemId: z.string().min(1, "Inventory item is required"),
  fromLocationId: z.string().min(1, "Source location is required"),
  toLocationId: z.string().min(1, "Destination location is required"),
  quantity: z.number().int().positive("Quantity must be at least 1").optional(),
  inventoryUnitId: z.string().optional(),
  unitIds: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const stockAdjustSchema = z.object({
  inventoryItemId: z.string().min(1, "Inventory item is required"),
  locationId: z.string().min(1, "Stock location is required"),
  newQuantity: z.number().int().min(0, "Quantity cannot be negative"),
  notes: z.string().min(3, "Mandatory reason for audit reconciliation (minimum 3 characters)"),
});

export type TUnitIntakeItem = z.infer<typeof unitIntakeItemSchema>;
export type TStockInInput = z.infer<typeof stockInSchema>;
export type TStockOutInput = z.infer<typeof stockOutSchema>;
export type TStockTransferInput = z.infer<typeof stockTransferSchema>;
export type TStockAdjustInput = z.infer<typeof stockAdjustSchema>;

