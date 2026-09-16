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
import { TReturn } from "@/type";
import {
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  MapPin,
  FileText,
} from "lucide-react";

interface ReturnDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnRecord: TReturn | null;
}

export default function ReturnDetailsModal({
  open,
  onOpenChange,
  returnRecord,
}: ReturnDetailsModalProps) {
  if (!returnRecord) return null;

  const processor = returnRecord.processedBy || returnRecord.returnedBy;
  const lines = returnRecord.lines || returnRecord.items || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-5 pb-3 border-b bg-card shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <DialogTitle className="flex items-center gap-2 text-foreground font-bold">
                <RotateCcw className="size-5 text-primary" />
                <span>Return Transaction: {returnRecord.returnNumber || returnRecord.returnNo}</span>
              </DialogTitle>
              <DialogDescription>
                Processed on{" "}
                {new Date(returnRecord.returnedAt || returnRecord.createdAt).toLocaleDateString(
                  undefined,
                  {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}
              </DialogDescription>
            </div>

            <Badge variant="outline" className="text-xs uppercase">
              {returnRecord.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Summary Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-lg border bg-muted/20 text-xs">
            <div className="space-y-1">
              <span className="text-muted-foreground block font-medium">Distribution Reference:</span>
              <p className="font-semibold text-foreground font-mono">
                {returnRecord.distribution?.distributionNo || returnRecord.distributionId}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-muted-foreground block font-medium">Processed By:</span>
              <p className="font-semibold text-foreground">
                {processor
                  ? `${processor.firstName} ${processor.lastName}`
                  : "Storekeeper"}
              </p>
            </div>

            {returnRecord.remarks && (
              <div className="sm:col-span-2 space-y-1 border-t pt-2 mt-1">
                <span className="text-muted-foreground block font-medium">Return Remarks:</span>
                <p className="text-muted-foreground">{returnRecord.remarks}</p>
              </div>
            )}
          </div>

          {/* Returned Items Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Returned & Restocked Items ({lines.length})
            </h4>

            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-xs py-2.5">Item</TableHead>
                    <TableHead className="text-xs py-2.5 text-center">Unit Tag</TableHead>
                    <TableHead className="text-xs py-2.5 text-center">Qty</TableHead>
                    <TableHead className="text-xs py-2.5 text-center">Condition</TableHead>
                    <TableHead className="text-xs py-2.5">Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((line, idx) => {
                    const item = line.inventoryItem || line.item;
                    const unit = line.inventoryUnit || line.unit;
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
                          {unit ? (
                            <Badge variant="outline" className="font-mono text-[10px]">
                              {unit.uniqueCode}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Bulk</span>
                          )}
                        </TableCell>

                        <TableCell className="py-2.5 text-center font-bold text-xs">
                          {line.quantity} {item?.unitName || "pcs"}
                        </TableCell>

                        <TableCell className="py-2.5 text-center">
                          <Badge
                            variant={
                              line.condition === "GOOD" || line.condition === "SAME"
                                ? "default"
                                : "destructive"
                            }
                            className={`text-[10px] ${
                              line.condition === "GOOD" || line.condition === "SAME"
                                ? "bg-emerald-600 hover:bg-emerald-600"
                                : ""
                            }`}
                          >
                            {line.condition}
                          </Badge>
                        </TableCell>

                        <TableCell className="py-2.5 text-xs text-muted-foreground max-w-xs truncate">
                          {line.remarks || "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t bg-card shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close Details
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
