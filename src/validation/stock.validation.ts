import z from "zod";

export const stockInSchema = z.object({
  inventoryItemId: z.string().min(1, "Inventory item is required"),
  locationId: z.string().min(1, "Stock location is required"),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  type: z.enum(["PURCHASE", "STOCK_IN", "INITIAL_STOCK"]),
  notes: z.string().optional(),
});

export const stockOutSchema = z.object({
  inventoryItemId: z.string().min(1, "Inventory item is required"),
  locationId: z.string().min(1, "Stock location is required"),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  type: z.enum(["STOCK_OUT", "DAMAGE", "LOSS", "DISPOSAL", "GIFT"]),
  notes: z.string().optional(),
});

export const stockTransferSchema = z.object({
  inventoryItemId: z.string().min(1, "Inventory item is required"),
  fromLocationId: z.string().min(1, "Source location is required"),
  toLocationId: z.string().min(1, "Destination location is required"),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  inventoryUnitId: z.string().optional(),
  notes: z.string().optional(),
});

export const stockAdjustSchema = z.object({
  inventoryItemId: z.string().min(1, "Inventory item is required"),
  locationId: z.string().min(1, "Stock location is required"),
  newQuantity: z.number().int().min(0, "Quantity cannot be negative"),
  notes: z.string().min(3, "Mandatory reason for audit reconciliation (minimum 3 characters)"),
});

export type TStockInInput = z.infer<typeof stockInSchema>;
export type TStockOutInput = z.infer<typeof stockOutSchema>;
export type TStockTransferInput = z.infer<typeof stockTransferSchema>;
export type TStockAdjustInput = z.infer<typeof stockAdjustSchema>;
