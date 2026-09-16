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
import {
  useActionApprovalRequestMutation,
  useResubmitApprovalRequestMutation,
} from "@/redux/api/approvalApi";
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
  FileCode2,
  RotateCcw,
  Info,
} from "lucide-react";
import { TApprovalRequest } from "@/type";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

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
  const [resubmitApproval, { isLoading: isResubmitting }] =
    useResubmitApprovalRequestMutation();

  const [selectedDecision, setSelectedDecision] = useState<
    "APPROVE" | "REJECT" | "REQUEST_CHANGE"
  >("APPROVE");

  // Resubmission mode
  const [showResubmitForm, setShowResubmitForm] = useState(false);
  const [resubmitPayloadJson, setResubmitPayloadJson] = useState("");
  const [resubmitReason, setResubmitReason] = useState("");

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
  const isRejectedOrCorrection =
    request.status === "REJECTED" || request.status === "RETURN_FOR_CORRECTION";

  const metadata = request.metadata || {};
  const stagedPayload = metadata.payload;
  const stagedAction = metadata.action || "CREATE";
  const feedback =
    metadata.rejectionFeedback ||
    metadata.correctionFeedback ||
    request.records?.slice(-1)[0]?.comments;

  const handleDecisionSubmit = async (values: TActionApprovalInput) => {
    if (
      (selectedDecision === "REJECT" || selectedDecision === "REQUEST_CHANGE") &&
      (!values.comments?.trim() || values.comments.trim().length < 5)
    ) {
      toast.error("Mandatory feedback/reason of at least 5 characters is required.");
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
          ? "Approval decision recorded & executed successfully."
          : selectedDecision === "REJECT"
          ? "Request has been rejected with feedback."
          : "Request returned for correction with feedback."
      );
      methods.reset();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to submit approval decision");
    }
  };

  const handleOpenResubmit = () => {
    setResubmitPayloadJson(
      JSON.stringify(stagedPayload || {}, null, 2)
    );
    setResubmitReason("");
    setShowResubmitForm(true);
  };

  const handleConfirmResubmit = async () => {
    let parsed: any;
    try {
      parsed = JSON.parse(resubmitPayloadJson);
    } catch (e) {
      toast.error("Invalid JSON format in corrected data payload.");
      return;
    }

    try {
      await resubmitApproval({
        id: request.id,
        updatedPayload: parsed,
        resubmitReason: resubmitReason.trim() || "Corrected as requested",
      }).unwrap();

      toast.success("Request revised and resubmitted successfully to Super Admin!");
      setShowResubmitForm(false);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to resubmit request");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-5 pb-3 border-b bg-card shrink-0">
          <DialogTitle className="flex items-center gap-2 text-foreground font-bold">
            <CheckSquare className="size-5 text-primary" />
            Review Approval Task: {request.requestNumber || request.id.slice(-8).toUpperCase()}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Multi-tier verification for <strong className="text-foreground font-mono">{request.entityType}</strong> ({stagedAction}) requested by{" "}
            <strong className="text-foreground">
              {request.requestedBy
                ? `${request.requestedBy.firstName} ${request.requestedBy.lastName}`
                : "Requester"}
            </strong>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Rejection / Return Feedback Banner */}
          {isRejectedOrCorrection && feedback && (
            <div className="p-3.5 rounded-lg border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="size-4 text-rose-600 shrink-0" />
                <span>Super Admin Feedback / Rejection Reason:</span>
              </div>
              <p className="pl-5 text-foreground leading-relaxed font-medium">
                "{feedback}"
              </p>
              {metadata.rejectedAt && (
                <p className="pl-5 text-[10px] text-muted-foreground mt-1">
                  Recorded on: {new Date(metadata.rejectedAt).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Self Approval Warning */}
          {isSelfRequester && isPending && !user?.isSuperAdmin && (
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

          {/* Staged Payload Inspector (What was submitted?) */}
          {stagedPayload && (
            <div className="rounded-lg border bg-muted/30 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <FileCode2 className="size-4 text-primary" />
                  <span>Proposed Staged Data ({stagedAction})</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">
                  {request.permissionCode}
                </span>
              </div>

              {/* Render key values cleanly */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {Object.entries(stagedPayload)
                  .filter(([k, v]) => v !== null && v !== undefined && typeof v !== "object")
                  .slice(0, 9)
                  .map(([key, value]) => (
                    <div key={key} className="p-2 rounded bg-card border">
                      <span className="text-[10px] uppercase font-mono text-muted-foreground block truncate">
                        {key}
                      </span>
                      <span className="font-semibold text-foreground truncate block">
                        {String(value)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Timeline visualization */}
          <ApprovalTimeline
            records={request.records || []}
            currentLevel={request.currentLevel}
          />

          {/* Fix & Resubmit / Edit Staged Data Section for Requester / Admin */}
          {(isRejectedOrCorrection || isPending) && (isSelfRequester || user?.isSuperAdmin) && (
            <div className="pt-2 border-t space-y-3">
              {!showResubmitForm ? (
                <div className="flex items-center justify-between p-3 rounded-lg border bg-sky-50 dark:bg-sky-950/30">
                  <div className="space-y-0.5 text-xs">
                    <p className="font-semibold text-sky-800 dark:text-sky-300">
                      {isRejectedOrCorrection
                        ? "Need to address the feedback and resubmit?"
                        : "Need to modify or correct the proposed data?"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {isRejectedOrCorrection
                        ? "You can edit the staged data and resubmit this request back to Super Admin for approval."
                        : "You can update the proposed parameters for this pending approval request."}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleOpenResubmit}
                    className="gap-1.5 text-xs bg-primary shrink-0"
                  >
                    <RotateCcw className="size-3.5" />
                    {isRejectedOrCorrection ? "Fix & Resubmit" : "Edit Staged Data"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 p-4 rounded-lg border bg-card shadow-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <RotateCcw className="size-3.5 text-primary" />
                      {isRejectedOrCorrection
                        ? "Correct Payload & Resubmit for Review"
                        : "Edit & Update Staged Request Data"}
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => setShowResubmitForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">
                      {isRejectedOrCorrection
                        ? "Correction Reason / Notes for Super Admin:"
                        : "Revision Reason / Change Summary:"}
                    </Label>
                    <input
                      type="text"
                      className="w-full text-xs h-8 px-2.5 rounded border bg-background"
                      placeholder={
                        isRejectedOrCorrection
                          ? "e.g. Corrected SKU format and updated quantity..."
                          : "e.g. Corrected category code and description..."
                      }
                      value={resubmitReason}
                      onChange={(e) => setResubmitReason(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">
                      Corrected Data Payload (JSON):
                    </Label>
                    <Textarea
                      className="font-mono text-xs max-h-40 leading-tight"
                      rows={5}
                      value={resubmitPayloadJson}
                      onChange={(e) => setResubmitPayloadJson(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowResubmitForm(false)}
                      disabled={isResubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleConfirmResubmit}
                      disabled={isResubmitting}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {isResubmitting && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
                      {isRejectedOrCorrection ? "Send to Super Admin" : "Save & Update Request"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Decision Form for Reviewer (if PENDING) */}
          {isPending && (!isSelfRequester || user?.isSuperAdmin) && (
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
                      Approve & Apply
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
                      : "Mandatory Reason / Correction Feedback (Required)"
                  }
                  placeholder={
                    selectedDecision === "APPROVE"
                      ? "Optional sign-off comments..."
                      : "Provide specific justification or instructions for the user..."
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

          {!isPending && !showResubmitForm && (
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
