import z from "zod";

export const actionApprovalSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT", "REQUEST_CHANGE"]),
  comments: z.string().optional(),
});

export type TActionApprovalInput = z.infer<typeof actionApprovalSchema>;
