"use client";

import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormTextarea } from "@/components/shared/form/FormTextarea";
import ApprovalTimeline from "@/components/approvals/ApprovalTimeline";
import { useActionApprovalRequestMutation } from "@/redux/api/approvalApi";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  actionApprovalSchema,
  TActionApprovalInput,
} from "@/validation/approval.validation";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  CheckSquare,
  ShieldAlert,
} from "lucide-react";
import { TApprovalRequest } from "@/type";

interface ApprovalDecisionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: TApprovalRequest | null;
}

export default function ApprovalDecisionModal({
  open,
  onOpenChange,
  request,
}: ApprovalDecisionModalProps) {
  const { user } = useCurrentUser();
  const [actionApproval, { isLoading }] = useActionApprovalRequestMutation();
  const [selectedDecision, setSelectedDecision] = useState<
    "APPROVE" | "REJECT" | "REQUEST_CHANGE"
  >("APPROVE");

  const methods = useForm<TActionApprovalInput>({
    resolver: zodResolver(actionApprovalSchema),
    defaultValues: {
      decision: "APPROVE",
      comments: "",
    },
  });

  if (!request) return null;

  const isSelfRequester = user?.id === request.requestedById;
  const isPending = request.status === "PENDING";

  const handleDecisionSubmit = async (values: TActionApprovalInput) => {
    if (
      (selectedDecision === "REJECT" || selectedDecision === "REQUEST_CHANGE") &&
      !values.comments?.trim()
    ) {
      toast.error("Please provide comments or a justification for this decision.");
      return;
    }

    try {
      await actionApproval({
        id: request.id,
        decision: selectedDecision,
        comments: values.comments || undefined,
      }).unwrap();

      toast.success(
        selectedDecision === "APPROVE"
          ? "Approval decision recorded successfully."
          : selectedDecision === "REJECT"
          ? "Request has been rejected."
          : "Request returned for correction."
      );
      methods.reset();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to submit approval decision");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground font-bold">
            <CheckSquare className="size-5 text-primary" />
            Review Approval Task: {request.requestNumber || request.id.slice(-8).toUpperCase()}
          </DialogTitle>
          <DialogDescription>
            Multi-tier verification for {request.entityType} requested by{" "}
            <strong className="text-foreground">
              {request.requestedBy
                ? `${request.requestedBy.firstName} ${request.requestedBy.lastName}`
                : "Requester"}
            </strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Self Approval Warning */}
          {isSelfRequester && (
            <div className="p-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 flex items-start gap-2.5 text-xs">
              <ShieldAlert className="size-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Self-Approval Restriction</p>
                <p>
                  You are the original requester for this item. University policy strictly prevents
                  self-approval unless you hold super administrator override authority.
                </p>
              </div>
            </div>
          )}

          {/* Timeline visualization */}
          <ApprovalTimeline
            records={request.records || []}
            currentLevel={request.currentLevel}
          />

          {/* Action Decision Form */}
          {isPending && (
            <FormProvider {...methods}>
              <form
                onSubmit={methods.handleSubmit(handleDecisionSubmit)}
                className="space-y-4 pt-3 border-t"
              >
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                    Select Decision
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant={selectedDecision === "APPROVE" ? "default" : "outline"}
                      onClick={() => setSelectedDecision("APPROVE")}
                      className={`text-xs gap-1.5 h-9 ${
                        selectedDecision === "APPROVE"
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : "text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                      }`}
                    >
                      <CheckCircle2 className="size-3.5" />
                      Approve
                    </Button>

                    <Button
                      type="button"
                      variant={selectedDecision === "REQUEST_CHANGE" ? "default" : "outline"}
                      onClick={() => setSelectedDecision("REQUEST_CHANGE")}
                      className={`text-xs gap-1.5 h-9 ${
                        selectedDecision === "REQUEST_CHANGE"
                          ? "bg-amber-600 hover:bg-amber-700 text-white"
                          : "text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950"
                      }`}
                    >
                      <AlertTriangle className="size-3.5" />
                      Return / Fix
                    </Button>

                    <Button
                      type="button"
                      variant={selectedDecision === "REJECT" ? "default" : "outline"}
                      onClick={() => setSelectedDecision("REJECT")}
                      className={`text-xs gap-1.5 h-9 ${
                        selectedDecision === "REJECT"
                          ? "bg-rose-600 hover:bg-rose-700 text-white"
                          : "text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950"
                      }`}
                    >
                      <XCircle className="size-3.5" />
                      Reject
                    </Button>
                  </div>
                </div>

                <FormTextarea
                  name="comments"
                  label={
                    selectedDecision === "APPROVE"
                      ? "Approval Remarks (Optional)"
                      : "Mandatory Reason / Correction Request"
                  }
                  placeholder={
                    selectedDecision === "APPROVE"
                      ? "Optional sign-off comments..."
                      : "Provide detailed justification for rejection or required amendments..."
                  }
                  required={selectedDecision !== "APPROVE"}
                />

                <DialogFooter className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className={
                      selectedDecision === "APPROVE"
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : selectedDecision === "REJECT"
                        ? "bg-rose-600 hover:bg-rose-700 text-white"
                        : "bg-amber-600 hover:bg-amber-700 text-white"
                    }
                  >
                    {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Confirm {selectedDecision.replace("_", " ")}
                  </Button>
                </DialogFooter>
              </form>
            </FormProvider>
          )}

          {!isPending && (
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Close Details
              </Button>
            </DialogFooter>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
