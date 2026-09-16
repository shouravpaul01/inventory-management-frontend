import z from "zod";

export const actionApprovalSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT", "REQUEST_CHANGE"]),
  comments: z.string().optional(),
});

export type TActionApprovalInput = z.infer<typeof actionApprovalSchema>;

export const approvalPolicySchema = z
  .object({
    requirement: z.enum(["NOT_REQUIRED", "REQUIRED"]),
    scope: z.enum(["USER", "ROLE"]),
    userId: z.string().optional(),
    roleId: z.string().optional(),
    permissionCodes: z
      .array(z.string())
      .min(1, "Please select at least one action / permission"),
    approvalLevelCount: z.number().min(1).max(5),
    allowSelfApproval: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.scope === "USER" && !data.userId) {
        return false;
      }
      return true;
    },
    {
      message: "Please select a specific person (user)",
      path: ["userId"],
    }
  )
  .refine(
    (data) => {
      if (data.scope === "ROLE" && !data.roleId) {
        return false;
      }
      return true;
    },
    {
      message: "Please select a target role",
      path: ["roleId"],
    }
  );

export type TApprovalPolicyInput = z.infer<typeof approvalPolicySchema>;
