import z from "zod";

export const createDistributionLineSchema = z.object({
  requisitionLineId: z.string().optional(),
  inventoryItemId: z.string().min(1, "Item is required"),
  inventoryUnitId: z.string().optional(),
  locationId: z.string().min(1, "Source location is required"),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  issueMode: z.enum(["PERMANENT", "TEMPORARY", "GIFT"]),
  condition: z.enum(["NEW", "GOOD", "FAIR", "DAMAGED"]),
  expectedReturnAt: z.string().optional(),
  remarks: z.string().optional(),
});

export const createDistributionSchema = z.object({
  requisitionId: z.string().min(1, "Requisition is required"),
  receiverId: z.string().min(1, "Receiver is required"),
  issueMode: z.enum(["PERMANENT", "TEMPORARY", "GIFT"]),
  handoverMethod: z.enum(["SELF_COLLECTION", "DELIVERED_BY_STAFF", "COURIER", "OTHER"]),
  expectedReturnAt: z.string().optional(),
  remarks: z.string().optional(),
  lines: z.array(createDistributionLineSchema).min(1, "Must distribute at least one item line"),
});

export const confirmDeliverySchema = z.object({
  deliveryStatus: z.enum(["DELIVERED", "RECEIVED", "REJECTED", "FAILED"]),
  receiverRemarks: z.string().optional(),
});

export type TCreateDistributionLineInput = z.infer<typeof createDistributionLineSchema>;
export type TCreateDistributionInput = z.infer<typeof createDistributionSchema>;
export type TConfirmDeliveryInput = z.infer<typeof confirmDeliverySchema>;
