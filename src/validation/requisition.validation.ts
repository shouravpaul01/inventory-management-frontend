import z from "zod";

export const requisitionLineSchema = z.object({
  inventoryItemId: z.string().min(1, "Item selection is required"),
  requestedQty: z.number().int().positive("Requested quantity must be at least 1"),
  requestedIssuePolicy: z.enum(["PERMANENT", "TEMPORARY", "GIFT"]).optional(),
  remarks: z.string().optional(),
});

export const createRequisitionSchema = z.object({
  type: z.enum(["REQUISITION", "ORDER"]),
  departmentId: z.string().min(1, "Department is required"),
  purpose: z.string().min(3, "Purpose must be at least 3 characters"),
  remarks: z.string().optional(),
  isTemporary: z.boolean(),
  requiredFrom: z.string().optional(),
  requiredUntil: z.string().optional(),
  lines: z
    .array(requisitionLineSchema)
    .min(1, "At least one item line is required for requisition"),
});

export const updateRequisitionSchema = z.object({
  purpose: z.string().min(3).optional(),
  remarks: z.string().optional(),
  isTemporary: z.boolean().optional(),
  requiredFrom: z.string().optional(),
  requiredUntil: z.string().optional(),
  lines: z.array(requisitionLineSchema).optional(),
});

export const reviewLineSchema = z.object({
  lineId: z.string().min(1, "Line ID is required"),
  approvedQty: z.number().int().min(0, "Approved quantity cannot be negative"),
  status: z.enum(["APPROVED", "PARTIALLY_APPROVED", "REJECTED"]),
  remarks: z.string().optional(),
});

export const reviewRequisitionSchema = z.object({
  decision: z.enum(["APPROVED", "PARTIALLY_APPROVED", "REJECTED"]),
  comments: z.string().optional(),
  lines: z.array(reviewLineSchema).min(1, "Must review at least one item line"),
});

export type TRequisitionLineInput = z.infer<typeof requisitionLineSchema>;
export type TCreateRequisitionInput = z.infer<typeof createRequisitionSchema>;
export type TUpdateRequisitionInput = z.infer<typeof updateRequisitionSchema>;
export type TReviewRequisitionInput = z.infer<typeof reviewRequisitionSchema>;
