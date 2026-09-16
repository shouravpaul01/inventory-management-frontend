"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TRequisition } from "@/type";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  Calendar,
  Building2,
  User as UserIcon,
  Package,
  Pencil,
} from "lucide-react";
import { useSubmitRequisitionMutation } from "@/redux/api/requisitionApi";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePermission } from "@/hooks/usePermission";
import { toast } from "sonner";

interface RequisitionDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requisition: TRequisition | null;
  onEdit?: (req: TRequisition) => void;
}

export default function RequisitionDetailsModal({
  open,
  onOpenChange,
  requisition,
  onEdit,
}: RequisitionDetailsModalProps) {
  const { user } = useCurrentUser();
  const { can } = usePermission();
  const [submitRequisition, { isLoading: isSubmitting }] =
    useSubmitRequisitionMutation();

  if (!requisition) return null;

  const isOwner = user?.id === requisition.requesterId;
  const canSubmit =
    isOwner &&
    (requisition.status === "DRAFT" || requisition.status === "REJECTED") &&
    can("requisition.submit");
  const lines = requisition.lines || requisition.items || [];

  const handleSubmit = async () => {
    try {
      await submitRequisition(requisition.id).unwrap();
      toast.success(
        requisition.status === "REJECTED"
          ? "Requisition revised and resubmitted for Super Admin approval."
          : "Requisition submitted for departmental review."
      );
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to submit requisition");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-5 pb-3 border-b bg-card shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <DialogTitle className="flex items-center gap-2 text-foreground font-bold">
                <FileText className="size-5 text-primary" />
                <span>{requisition.requestNumber || requisition.requisitionNo}</span>
              </DialogTitle>
              <DialogDescription>
                Created on {new Date(requisition.createdAt).toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </DialogDescription>
            </div>

            <Badge variant="outline" className="text-xs uppercase">
              {requisition.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Rejection Feedback Alert */}
          {requisition.status === "REJECTED" && (
            <div className="p-3.5 rounded-lg border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <XCircle className="size-4 text-rose-600 shrink-0" />
                <span>Super Admin Rejection Feedback:</span>
              </div>
              <p className="pl-5 text-foreground leading-relaxed font-medium">
                "{requisition.remarks || "Requisition was rejected by the reviewer."}"
              </p>
              <p className="pl-5 text-[11px] text-muted-foreground mt-1">
                You can address this feedback and click "Resubmit Requisition" below to send it back to Super Admin for approval.
              </p>
            </div>
          )}

          {/* Summary Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-lg border bg-muted/20 text-xs">
            <div className="space-y-1">
              <span className="text-muted-foreground block font-medium">Requester:</span>
              <p className="font-semibold text-foreground">
                {requisition.requester
                  ? `${requisition.requester.firstName} ${requisition.requester.lastName}`
                  : "Requester"}
              </p>
              {requisition.requester?.email && (
                <p className="text-muted-foreground">{requisition.requester.email}</p>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-muted-foreground block font-medium">Department:</span>
              <p className="font-semibold text-foreground">
                {requisition.department?.name || "General Department"}
              </p>
              <p className="text-muted-foreground">Type: {requisition.type || "REQUISITION"}</p>
            </div>

            <div className="sm:col-span-2 space-y-1 border-t pt-2 mt-1">
              <span className="text-muted-foreground block font-medium">Purpose:</span>
              <p className="text-foreground">{requisition.purpose}</p>
            </div>

            {requisition.isTemporary && (
              <div className="sm:col-span-2 p-2.5 rounded border border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs">
                <strong>Temporary Loan Schedule:</strong>{" "}
                {requisition.requiredFrom
                  ? new Date(requisition.requiredFrom).toLocaleDateString()
                  : "Immediate"}{" "}
                &rarr;{" "}
                {requisition.requiredUntil
                  ? new Date(requisition.requiredUntil).toLocaleDateString()
                  : "Until return"}
              </div>
            )}

            {requisition.remarks && (
              <div className="sm:col-span-2 space-y-1 border-t pt-2 mt-1">
                <span className="text-muted-foreground block font-medium">Remarks:</span>
                <p className="text-muted-foreground">{requisition.remarks}</p>
              </div>
            )}
          </div>

          {/* Requested Items Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Requested Material Lines ({lines.length})
            </h4>

            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-xs py-2.5">Item</TableHead>
                    <TableHead className="text-xs py-2.5 text-center">Policy</TableHead>
                    <TableHead className="text-xs py-2.5 text-center">Requested</TableHead>
                    <TableHead className="text-xs py-2.5 text-center">Approved</TableHead>
                    <TableHead className="text-xs py-2.5 text-center">Issued</TableHead>
                    <TableHead className="text-xs py-2.5 text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((line, idx) => {
                    const item = line.inventoryItem || line.item;
                    return (
                      <TableRow key={line.id || idx}>
                        <TableCell className="py-2.5">
                          <p className="font-medium text-xs text-foreground">
                            {item?.name || "Material Item"}
                          </p>
                          <span className="text-[11px] font-mono text-muted-foreground">
                            {item?.code}
                          </span>
                        </TableCell>

                        <TableCell className="py-2.5 text-center">
                          <Badge variant="outline" className="text-[10px]">
                            {line.requestedIssuePolicy || "PERMANENT"}
                          </Badge>
                        </TableCell>

                        <TableCell className="py-2.5 text-center font-semibold text-xs">
                          {line.requestedQty} {item?.unitName || "pcs"}
                        </TableCell>

                        <TableCell className="py-2.5 text-center font-bold text-xs text-emerald-600">
                          {line.approvedQty ?? 0}
                        </TableCell>

                        <TableCell className="py-2.5 text-center font-medium text-xs text-blue-600">
                          {line.issuedQty ?? 0}
                        </TableCell>

                        <TableCell className="py-2.5 text-center">
                          <Badge
                            variant={
                              line.status === "APPROVED"
                                ? "default"
                                : line.status === "REJECTED"
                                ? "destructive"
                                : "outline"
                            }
                            className="text-[10px]"
                          >
                            {line.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t bg-card shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2 w-full">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>

          <div className="flex items-center gap-2">
            {isOwner && (requisition.status === "DRAFT" || requisition.status === "REJECTED") && onEdit && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  onOpenChange(false);
                  onEdit(requisition);
                }}
                className="gap-1.5"
              >
                <Pencil className="size-3.5" />
                Edit Items & Details
              </Button>
            )}

            {canSubmit && (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={
                  requisition.status === "REJECTED"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                    : "gap-1.5"
                }
              >
                <Send className="size-4" />
                {requisition.status === "REJECTED"
                  ? "Revise & Resubmit for Approval"
                  : "Submit for Approval"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
