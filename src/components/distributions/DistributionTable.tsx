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
import { TDistribution, TDeliveryStatus } from "@/type";
import {
  SendHorizontal,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  PackageCheck,
  User,
  Truck,
} from "lucide-react";
import { usePermission } from "@/hooks/usePermission";

interface DistributionTableProps {
  distributions: TDistribution[];
  isLoading: boolean;
  onViewDetails: (distribution: TDistribution) => void;
  onConfirmDelivery: (distribution: TDistribution) => void;
}

export default function DistributionTable({
  distributions,
  isLoading,
  onViewDetails,
  onConfirmDelivery,
}: DistributionTableProps) {
  const { can } = usePermission();
  const canConfirm = can("distribution.confirm_delivery");

  const getDeliveryBadge = (status?: TDeliveryStatus) => {
    switch (status) {
      case "RECEIVED":
        return (
          <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600 text-[10px] gap-1">
            <CheckCircle2 className="size-2.5" />
            Received
          </Badge>
        );
      case "DELIVERED":
        return (
          <Badge variant="secondary" className="bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 text-[10px] gap-1">
            <Truck className="size-2.5" />
            Delivered
          </Badge>
        );
      case "REJECTED":
      case "FAILED":
        return (
          <Badge variant="destructive" className="text-[10px] gap-1">
            <XCircle className="size-2.5" />
            {status}
          </Badge>
        );
      case "PENDING":
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground text-[10px] gap-1">
            <Clock className="size-2.5" />
            Pending Acknowledgment
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
              <TableHead className="font-semibold text-xs py-3.5">Distribution #</TableHead>
              <TableHead className="font-semibold text-xs py-3.5">Requisition Ref</TableHead>
              <TableHead className="font-semibold text-xs py-3.5">Recipient</TableHead>
              <TableHead className="font-semibold text-xs py-3.5">Handover Method</TableHead>
              <TableHead className="font-semibold text-xs py-3.5 text-center">Items</TableHead>
              <TableHead className="font-semibold text-xs py-3.5 text-center">Delivery Status</TableHead>
              <TableHead className="font-semibold text-xs py-3.5">Dispatched Date</TableHead>
              <TableHead className="font-semibold text-xs py-3.5 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableLoading colSpan={8} />
            ) : distributions.length === 0 ? (
              <TableEmpty
                colSpan={8}
                message="No distribution dispatches recorded."
                description="When approved requisitions are fulfilled and issued by storekeepers, dispatch records appear here."
              />
            ) : (
              distributions.map((dist) => {
                const receiver = dist.receiver || dist.recipient;
                const receiverName = receiver
                  ? `${receiver.firstName} ${receiver.lastName}`
                  : dist.recipientName || "Recipient";
                const lineCount = dist.lines?.length || dist.items?.length || 0;
                const isReceived = dist.deliveryStatus === "RECEIVED";

                return (
                  <TableRow key={dist.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="py-3 font-mono text-xs font-semibold text-foreground">
                      <div className="flex items-center gap-1.5">
                        <SendHorizontal className="size-3.5 text-primary shrink-0" />
                        <span>{dist.distributionNo}</span>
                      </div>
                    </TableCell>

                    <TableCell className="py-3 font-mono text-xs text-muted-foreground">
                      {dist.requisition?.requestNumber || dist.requisitionId.slice(-8).toUpperCase()}
                    </TableCell>

                    <TableCell className="py-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-xs font-medium text-foreground">
                          <User className="size-3 text-muted-foreground" />
                          <span>{receiverName}</span>
                        </div>
                        {receiver?.employeeId && (
                          <p className="text-[11px] text-muted-foreground">
                            ID: {receiver.employeeId}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="py-3 text-xs text-muted-foreground">
                      {dist.handoverMethod?.replace(/_/g, " ") || "Store Pickup"}
                    </TableCell>

                    <TableCell className="py-3 text-center">
                      <Badge variant="outline" className="font-mono text-xs">
                        {lineCount} items
                      </Badge>
                    </TableCell>

                    <TableCell className="py-3 text-center">
                      {getDeliveryBadge(dist.deliveryStatus)}
                    </TableCell>

                    <TableCell className="py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {dist.createdAt
                        ? new Date(dist.createdAt).toLocaleDateString(undefined, {
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
                          title="View Dispatch Challan"
                          onClick={() => onViewDetails(dist)}
                          className="hover:bg-muted"
                        >
                          <Eye className="size-3.5" />
                        </Button>

                        {canConfirm && !isReceived && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            title="Acknowledge Delivery"
                            onClick={() => onConfirmDelivery(dist)}
                            className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                          >
                            <PackageCheck className="size-3.5" />
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
