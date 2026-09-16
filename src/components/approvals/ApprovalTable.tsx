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
import { TApprovalRequest, TApprovalStatus } from "@/type";
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  XCircle,
  FileCheck,
  User,
  ArrowRight,
  AlertTriangle,
  RotateCcw,
  Pencil,
} from "lucide-react";
import { usePermission } from "@/hooks/usePermission";

interface ApprovalTableProps {
  requests: TApprovalRequest[];
  isLoading: boolean;
  onReview: (request: TApprovalRequest) => void;
}

export default function ApprovalTable({
  requests,
  isLoading,
  onReview,
}: ApprovalTableProps) {
  const { can } = usePermission();
  const canAction = can("approval.action") || can("requisition.approve");

  const getStatusBadge = (status: TApprovalStatus) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="secondary" className="bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 text-[10px] gap-1">
            <Clock className="size-2.5" />
            Pending Action
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600 text-[10px] gap-1">
            <CheckCircle2 className="size-2.5" />
            Approved
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="destructive" className="text-[10px] gap-1">
            <XCircle className="size-2.5" />
            Rejected
          </Badge>
        );
      case "RETURN_FOR_CORRECTION":
        return (
          <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] gap-1">
            <AlertTriangle className="size-2.5" />
            Needs Correction
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge variant="outline" className="text-muted-foreground text-[10px]">
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  return (
    <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="font-semibold text-xs py-3.5">Approval #</TableHead>
              <TableHead className="font-semibold text-xs py-3.5">Entity / Scope</TableHead>
              <TableHead className="font-semibold text-xs py-3.5">Requested By</TableHead>
              <TableHead className="font-semibold text-xs py-3.5 text-center">Current Stage</TableHead>
              <TableHead className="font-semibold text-xs py-3.5">Justification</TableHead>
              <TableHead className="font-semibold text-xs py-3.5 text-center">Status</TableHead>
              <TableHead className="font-semibold text-xs py-3.5">Submitted</TableHead>
              <TableHead className="font-semibold text-xs py-3.5 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableLoading colSpan={8} />
            ) : requests.length === 0 ? (
              <TableEmpty
                colSpan={8}
                message="No approval tasks in inbox."
                description="When requisitions, orders, or transfers require multi-level sign-off, they will appear here."
              />
            ) : (
              requests.map((req) => {
                const requester = req.requestedBy;
                const requesterName = requester
                  ? `${requester.firstName} ${requester.lastName || ""}`.trim()
                  : "Requester";
                const totalLevels = req.totalLevels || req.records?.length || 1;
                const currentLvl = req.currentLevel || 1;

                return (
                  <TableRow key={req.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="py-3 font-mono text-xs font-semibold text-foreground">
                      <div className="flex items-center gap-1.5">
                        <CheckSquare className="size-3.5 text-primary shrink-0" />
                        <span>{req.requestNumber || req.id.slice(-8).toUpperCase()}</span>
                      </div>
                    </TableCell>

                    <TableCell className="py-3">
                      <Badge variant="outline" className="text-xs font-medium">
                        {req.entityType}
                      </Badge>
                      {req.permissionCode && (
                        <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                          {req.permissionCode}
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="py-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-xs font-medium text-foreground">
                          <User className="size-3 text-muted-foreground" />
                          <span>{requesterName}</span>
                        </div>
                        {requester?.email && (
                          <p className="text-[11px] text-muted-foreground truncate max-w-xs">
                            {requester.email}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground px-2 py-0.5 rounded-full bg-muted/60">
                        Level {currentLvl} of {totalLevels}
                      </span>
                    </TableCell>

                    <TableCell className="py-3">
                      <p className="text-xs text-muted-foreground truncate max-w-xs" title={req.reason || ""}>
                        {req.reason || "Standard institutional workflow approval"}
                      </p>
                      {req.metadata?.rejectionFeedback && (
                        <p className="text-[10px] text-rose-600 dark:text-rose-400 font-medium truncate max-w-xs mt-0.5" title={req.metadata.rejectionFeedback}>
                          Reason: {req.metadata.rejectionFeedback}
                        </p>
                      )}
                      {req.metadata?.correctionFeedback && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium truncate max-w-xs mt-0.5" title={req.metadata.correctionFeedback}>
                          Notes: {req.metadata.correctionFeedback}
                        </p>
                      )}
                    </TableCell>

                    <TableCell className="py-3 text-center">
                      {getStatusBadge(req.status)}
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
                      {req.status === "RETURN_FOR_CORRECTION" ? (
                        <Button
                          size="sm"
                          onClick={() => onReview(req)}
                          className="text-xs gap-1 h-7 shadow-xs bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
                        >
                          <RotateCcw className="size-3.5" />
                          Fix & Resubmit
                        </Button>
                      ) : req.status === "REJECTED" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onReview(req)}
                          className="text-xs gap-1 h-7 shadow-xs text-rose-600 border-rose-200 hover:bg-rose-50 cursor-pointer"
                        >
                          <RotateCcw className="size-3.5" />
                          Feedback / Edit
                        </Button>
                      ) : req.status === "PENDING" ? (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => onReview(req)}
                          className="text-xs gap-1 h-7 shadow-xs bg-primary cursor-pointer"
                        >
                          <FileCheck className="size-3.5" />
                          Review / Edit
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onReview(req)}
                          className="text-xs gap-1 h-7 shadow-xs cursor-pointer"
                        >
                          <FileCheck className="size-3.5" />
                          View Details
                        </Button>
                      )}
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
