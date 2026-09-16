import { toast } from "sonner";

/**
 * Handles mutation responses across frontend forms.
 * When the backend interceptor catches an action that requires Super Admin approval,
 * it returns HTTP 202 with an approval request payload and descriptive message.
 * This helper ensures the user is clearly informed instead of showing a generic success message.
 */
export function handleMutationResult(
  res: any,
  defaultSuccessMessage: string
) {
  if (
    res?.statusCode === 202 ||
    res?.data?.status === "PENDING" ||
    (typeof res?.message === "string" && res.message.toLowerCase().includes("approval"))
  ) {
    toast.info(
      res.message ||
        "Action requires Super Admin approval and has been submitted to the approval queue.",
      {
        duration: 6000,
        description: "Your request is pending review in the Approvals Center.",
      }
    );
  } else {
    toast.success(res?.message || defaultSuccessMessage);
  }
}
