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
import { TDistribution } from "@/type";
import {
  SendHorizontal,
  Printer,
  CheckCircle2,
  Clock,
  User,
  Building2,
  QrCode,
  Truck,
  Image as ImageIcon,
} from "lucide-react";

interface DistributionDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  distribution: TDistribution | null;
}

export default function DistributionDetailsModal({
  open,
  onOpenChange,
  distribution,
}: DistributionDetailsModalProps) {
  if (!distribution) return null;

  const receiver = distribution.receiver || distribution.recipient;
  const issuer = distribution.issuedBy || distribution.distributedBy;
  const lines = distribution.lines || distribution.items || [];
  const confirmation = distribution.deliveryConfirmation;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto print:p-0 print:border-none">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <DialogTitle className="flex items-center gap-2 text-foreground font-bold">
                <SendHorizontal className="size-5 text-primary" />
                <span>Delivery Challan & Gate Pass: {distribution.distributionNo}</span>
              </DialogTitle>
              <DialogDescription>
                Issued on{" "}
                {new Date(distribution.createdAt).toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </DialogDescription>
            </div>

            <Badge
              variant={
                distribution.deliveryStatus === "RECEIVED"
                  ? "default"
                  : "outline"
              }
              className={`text-xs uppercase ${
                distribution.deliveryStatus === "RECEIVED"
                  ? "bg-emerald-600 hover:bg-emerald-600"
                  : ""
              }`}
            >
              {distribution.deliveryStatus || "PENDING"}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Challan Header Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-lg border bg-muted/20 text-xs">
            <div className="space-y-1">
              <span className="text-muted-foreground block font-medium">Recipient / Receiver:</span>
              <p className="font-semibold text-foreground text-sm">
                {receiver
                  ? `${receiver.firstName} ${receiver.lastName}`
                  : distribution.recipientName || "Authorized Recipient"}
              </p>
              {receiver?.employeeId && (
                <p className="text-muted-foreground font-mono">Employee ID: {receiver.employeeId}</p>
              )}
              {receiver?.email && (
                <p className="text-muted-foreground">{receiver.email}</p>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-muted-foreground block font-medium">Issuer / Storekeeper:</span>
              <p className="font-semibold text-foreground text-sm">
                {issuer ? `${issuer.firstName} ${issuer.lastName}` : "Central Store Officer"}
              </p>
              <p className="text-muted-foreground">
                Requisition Ref:{" "}
                <span className="font-mono">
                  {distribution.requisition?.requestNumber || distribution.requisitionId}
                </span>
              </p>
              <p className="text-muted-foreground">
                Handover: {distribution.handoverMethod?.replace(/_/g, " ") || "Store Pickup"}
              </p>
            </div>

            {distribution.remarks && (
              <div className="sm:col-span-2 space-y-1 border-t pt-2 mt-1">
                <span className="text-muted-foreground block font-medium">Challan Remarks:</span>
                <p className="text-muted-foreground">{distribution.remarks}</p>
              </div>
            )}
          </div>

          {/* Dispatched Line Items Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Dispatched Material Items ({lines.length})
            </h4>

            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-xs py-2.5">Item & Code</TableHead>
                    <TableHead className="text-xs py-2.5 text-center">Unit Tag / Serial</TableHead>
                    <TableHead className="text-xs py-2.5 text-center">Qty</TableHead>
                    <TableHead className="text-xs py-2.5 text-center">Condition</TableHead>
                    <TableHead className="text-xs py-2.5 text-center">Policy</TableHead>
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
                            {item?.name || "Inventory Item"}
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
                          <Badge variant="secondary" className="text-[10px]">
                            {line.condition || "GOOD"}
                          </Badge>
                        </TableCell>

                        <TableCell className="py-2.5 text-center">
                          <Badge variant="outline" className="text-[10px]">
                            {line.issueMode || distribution.issueMode || "PERMANENT"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Delivery Confirmation Card if available */}
          {confirmation && (
            <div className="p-3.5 rounded-lg border border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold">
                <CheckCircle2 className="size-4" />
                <span>Recipient Handover Acknowledged</span>
              </div>
              <div className="text-muted-foreground space-y-1">
                {confirmation.confirmedAt && (
                  <p>
                    Confirmed on:{" "}
                    <strong>{new Date(confirmation.confirmedAt).toLocaleString()}</strong>
                  </p>
                )}
                {confirmation.receiverRemarks && (
                  <p>
                    Recipient Remarks: <em>&ldquo;{confirmation.receiverRemarks}&rdquo;</em>
                  </p>
                )}
                {confirmation.signatureUrl && (
                  <div className="mt-2">
                    <span className="block font-medium text-foreground mb-1">
                      Recipient Signature Proof:
                    </span>
                    <img
                      src={confirmation.signatureUrl}
                      alt="Signature"
                      className="max-h-24 rounded border bg-white object-contain"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-4 flex items-center justify-between sm:justify-between w-full">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={handlePrint}
            className="gap-1.5"
          >
            <Printer className="size-4" />
            Print Gate Pass / Challan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
