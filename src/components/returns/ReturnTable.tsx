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
import { TReturn, TReturnTransactionStatus } from "@/type";
import {
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  Eye,
  User,
} from "lucide-react";

interface ReturnTableProps {
  returns: TReturn[];
  isLoading: boolean;
  onViewDetails: (ret: TReturn) => void;
}

export default function ReturnTable({
  returns,
  isLoading,
  onViewDetails,
}: ReturnTableProps) {
  const getStatusBadge = (status: TReturnTransactionStatus) => {
    switch (status) {
      case "RETURNED":
        return (
          <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600 text-[10px] gap-1">
            <CheckCircle2 className="size-2.5" />
            Returned
          </Badge>
        );
      case "PARTIALLY_RETURNED":
        return (
          <Badge variant="secondary" className="bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 text-[10px] gap-1">
            <Clock className="size-2.5" />
            Partial Return
          </Badge>
        );
      case "OVERDUE":
        return (
          <Badge variant="destructive" className="text-[10px] gap-1">
            <AlertTriangle className="size-2.5" />
            Overdue
          </Badge>
        );
      case "LOST":
        return (
          <Badge variant="outline" className="text-destructive border-destructive text-[10px] gap-1">
            <XCircle className="size-2.5" />
            Lost / Unreturned
          </Badge>
        );
      case "EXPECTED":
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground text-[10px]">
            Expected Return
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
              <TableHead className="font-semibold text-xs py-3.5">Return #</TableHead>
              <TableHead className="font-semibold text-xs py-3.5">Distribution Ref</TableHead>
              <TableHead className="font-semibold text-xs py-3.5">Processed By</TableHead>
              <TableHead className="font-semibold text-xs py-3.5 text-center">Items</TableHead>
              <TableHead className="font-semibold text-xs py-3.5 text-center">Status</TableHead>
              <TableHead className="font-semibold text-xs py-3.5">Date Processed</TableHead>
              <TableHead className="font-semibold text-xs py-3.5 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableLoading colSpan={7} />
            ) : returns.length === 0 ? (
              <TableEmpty
                colSpan={7}
                message="No return transactions recorded."
                description="When loaned equipment or damaged items are returned and restocked, records appear here."
              />
            ) : (
              returns.map((ret) => {
                const processor = ret.processedBy || ret.returnedBy;
                const processorName = processor
                  ? `${processor.firstName} ${processor.lastName}`
                  : "Storekeeper";
                const lineCount = ret.lines?.length || ret.items?.length || 0;

                return (
                  <TableRow key={ret.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="py-3 font-mono text-xs font-semibold text-foreground">
                      <div className="flex items-center gap-1.5">
                        <RotateCcw className="size-3.5 text-primary shrink-0" />
                        <span>{ret.returnNumber || ret.returnNo}</span>
                      </div>
                    </TableCell>

                    <TableCell className="py-3 font-mono text-xs text-muted-foreground">
                      {ret.distribution?.distributionNo || ret.distributionId.slice(-8).toUpperCase()}
                    </TableCell>

                    <TableCell className="py-3">
                      <div className="flex items-center gap-1 text-xs font-medium text-foreground">
                        <User className="size-3 text-muted-foreground" />
                        <span>{processorName}</span>
                      </div>
                    </TableCell>

                    <TableCell className="py-3 text-center">
                      <Badge variant="outline" className="font-mono text-xs">
                        {lineCount} items
                      </Badge>
                    </TableCell>

                    <TableCell className="py-3 text-center">
                      {getStatusBadge(ret.status)}
                    </TableCell>

                    <TableCell className="py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {ret.returnedAt || ret.createdAt
                        ? new Date(ret.returnedAt || ret.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "N/A"}
                    </TableCell>

                    <TableCell className="py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        title="View Return Details"
                        onClick={() => onViewDetails(ret)}
                        className="hover:bg-muted"
                      >
                        <Eye className="size-3.5" />
                      </Button>
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
