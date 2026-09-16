"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import TableEmpty from "@/components/shared/TableEmpty";
import TableLoading from "@/components/shared/TableLoading";
import { TRequisition, TRequisitionStatus, TFulfillmentStatus } from "@/type";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  Eye,
  Trash2,
  Calendar,
  Building2,
  User as UserIcon,
  Pencil,
} from "lucide-react";
import { usePermission } from "@/hooks/usePermission";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface RequisitionTableProps {
  requisitions: TRequisition[];
  isLoading: boolean;
  onViewDetails: (requisition: TRequisition) => void;
  onEdit?: (requisition: TRequisition) => void;
  onSubmitDraft?: (requisition: TRequisition) => void;
  onCancel?: (requisition: TRequisition) => void;
  onDelete?: (requisition: TRequisition) => void;
}

export default function RequisitionTable({
  requisitions,
  isLoading,
  onViewDetails,
  onEdit,
  onSubmitDraft,
  onCancel,
  onDelete,
}: RequisitionTableProps) {
  const { can } = usePermission();
  const { user } = useCurrentUser();

  const getStatusBadge = (status: TRequisitionStatus) => {
    switch (status) {
      case "DRAFT":
        return (
          <Badge variant="outline" className="text-muted-foreground text-[10px] gap-1">
            <Clock className="size-2.5" />
            Draft
          </Badge>
        );
      case "SUBMITTED":
      case "UNDER_REVIEW":
        return (
          <Badge variant="secondary" className="bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 text-[10px] gap-1">
            <Clock className="size-2.5" />
            In Review
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600 text-[10px] gap-1">
            <CheckCircle2 className="size-2.5" />
            Approved
          </Badge>
        );
      case "PARTIALLY_APPROVED":
        return (
          <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] gap-1">
            <AlertTriangle className="size-2.5" />
            Partially Approved
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="destructive" className="text-[10px] gap-1">
            <XCircle className="size-2.5" />
            Rejected
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge variant="outline" className="text-muted-foreground line-through text-[10px]">
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  const getFulfillmentBadge = (status?: TFulfillmentStatus) => {
    switch (status) {
      case "FULFILLED":
        return (
          <Badge variant="outline" className="text-emerald-700 border-emerald-600/40 text-[10px] gap-1">
            <CheckCircle2 className="size-2.5" /> Dispatched
          </Badge>
        );
      case "PARTIALLY_FULFILLED":
        return (
          <Badge variant="outline" className="text-sky-700 border-sky-600/40 text-[10px]">
            Partial
          </Badge>
        );
      case "PENDING":
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground text-[10px]">
            Pending Issue
          </Badge>
        );
    }
  };

  return (
    <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="font-semibold text-xs py-3.5">Requisition #</TableHead>
              <TableHead className="font-semibold text-xs py-3.5">Requester & Dept</TableHead>
              <TableHead className="font-semibold text-xs py-3.5">Purpose</TableHead>
              <TableHead className="font-semibold text-xs py-3.5 text-center">Items</TableHead>
              <TableHead className="font-semibold text-xs py-3.5 text-center">Approval Status</TableHead>
              <TableHead className="font-semibold text-xs py-3.5 text-center">Fulfillment</TableHead>
              <TableHead className="font-semibold text-xs py-3.5">Date</TableHead>
              <TableHead className="font-semibold text-xs py-3.5 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableLoading colSpan={8} />
            ) : requisitions.length === 0 ? (
              <TableEmpty
                colSpan={8}
                message="No material requisitions found."
                description="Create a new requisition to request departmental inventory or supplies."
              />
            ) : (
              requisitions.map((req) => {
                const requesterName = req.requester
                  ? `${req.requester.firstName} ${req.requester.lastName}`
                  : "Requester";
                const isOwner = user?.id === req.requesterId;
                const canEdit =
                  isOwner &&
                  (req.status === "DRAFT" || req.status === "REJECTED") &&
                  can("requisition.create");
                const canSubmit =
                  isOwner &&
                  (req.status === "DRAFT" || req.status === "REJECTED") &&
                  can("requisition.submit");
                const canCancel =
                  (isOwner || can("requisition.cancel")) &&
                  (req.status === "DRAFT" || req.status === "REJECTED");
                const lineCount = req.lines?.length || req.items?.length || 0;

                return (
                  <TableRow key={req.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="py-3 font-mono text-xs font-semibold text-foreground">
                      <div className="flex items-center gap-1.5">
                        <FileText className="size-3.5 text-primary shrink-0" />
                        <span>{req.requestNumber || req.requisitionNo}</span>
                      </div>
                      {req.isTemporary && (
                        <span className="inline-block mt-1 text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                          Loan (Returnable)
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="py-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-xs font-medium text-foreground">
                          <UserIcon className="size-3 text-muted-foreground" />
                          <span>{requesterName}</span>
                        </div>
                        {req.department && (
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Building2 className="size-3" />
                            <span>{req.department.name}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="py-3">
                      <p className="text-xs text-foreground font-medium max-w-xs truncate" title={req.purpose}>
                        {req.purpose}
                      </p>
                      {req.remarks && (
                        <p className="text-[11px] text-muted-foreground truncate max-w-xs">
                          {req.remarks}
                        </p>
                      )}
                    </TableCell>

                    <TableCell className="py-3 text-center">
                      <Badge variant="outline" className="font-mono text-xs">
                        {lineCount} items
                      </Badge>
                    </TableCell>

                    <TableCell className="py-3 text-center">
                      {getStatusBadge(req.status)}
                    </TableCell>

                    <TableCell className="py-3 text-center">
                      {getFulfillmentBadge(req.fulfillmentStatus)}
                    </TableCell>

                    <TableCell className="py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {req.createdAt
                        ? new Date(req.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "N/A"}
                    </TableCell>

                    <TableCell className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          title="View Requisition Details"
                          onClick={() => onViewDetails(req)}
                          className="hover:bg-muted"
                        >
                          <Eye className="size-3.5" />
                        </Button>

                        {canEdit && onEdit && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            title={
                              req.status === "REJECTED"
                                ? "Revise Rejected Requisition"
                                : "Edit Draft Requisition"
                            }
                            onClick={() => onEdit(req)}
                            className="text-amber-600 hover:bg-amber-500/10"
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                        )}

                        {canSubmit && onSubmitDraft && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            title={
                              req.status === "REJECTED"
                                ? "Resubmit to Super Admin"
                                : "Submit for Approval"
                            }
                            onClick={() => onSubmitDraft(req)}
                            className="text-primary hover:bg-primary/10"
                          >
                            <Send className="size-3.5" />
                          </Button>
                        )}

                        {canCancel && onCancel && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            title="Cancel / Delete Draft"
                            onClick={() => onCancel(req)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
