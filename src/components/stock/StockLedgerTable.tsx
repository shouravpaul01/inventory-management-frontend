"use client";

import { useState } from "react";
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
import { TStockMovement, TStockMovementType } from "@/type";
import {
  History,
  ArrowRight,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface StockLedgerTableProps {
  movements: TStockMovement[];
  isLoading: boolean;
}

export default function StockLedgerTable({
  movements,
  isLoading,
}: StockLedgerTableProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const getMovementTypeBadge = (type: TStockMovementType) => {
    switch (type) {
      case "PURCHASE":
      case "STOCK_IN":
      case "INITIAL_STOCK":
        return (
          <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600 text-[10px] gap-1">
            <ArrowDownLeft className="size-2.5" />
            {type.replace("_", " ")}
          </Badge>
        );
      case "TRANSFER":
        return (
          <Badge variant="secondary" className="bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 text-[10px] gap-1">
            <ArrowRightLeft className="size-2.5" />
            TRANSFER
          </Badge>
        );
      case "STOCK_OUT":
      case "DAMAGE":
      case "LOSS":
      case "DISPOSAL":
        return (
          <Badge variant="destructive" className="text-[10px] gap-1">
            <ArrowUpRight className="size-2.5" />
            {type}
          </Badge>
        );
      case "DISTRIBUTION":
        return (
          <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 text-[10px] gap-1">
            <ArrowUpRight className="size-2.5" />
            DISTRIBUTION
          </Badge>
        );
      case "RETURN":
        return (
          <Badge variant="secondary" className="bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 text-[10px] gap-1">
            <ArrowDownLeft className="size-2.5" />
            RETURN
          </Badge>
        );
      case "ADJUSTMENT":
        return (
          <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-400 text-[10px] gap-1">
            <AlertCircle className="size-2.5" />
            ADJUSTMENT
          </Badge>
        );
      case "RESERVATION":
      case "RESERVATION_RELEASE":
        return (
          <Badge variant="outline" className="text-muted-foreground text-[10px]">
            {type.replace("_", " ")}
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-[10px]">{type}</Badge>;
    }
  };

  const getQuantityDisplay = (m: TStockMovement) => {
    switch (m.type) {
      case "PURCHASE":
      case "STOCK_IN":
      case "INITIAL_STOCK":
      case "RETURN":
      case "RESERVATION_RELEASE":
        return (
          <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm">
            +{m.quantity}
          </span>
        );
      case "STOCK_OUT":
      case "DISTRIBUTION":
      case "DAMAGE":
      case "LOSS":
      case "DISPOSAL":
      case "GIFT":
      case "RESERVATION":
        return (
          <span className="font-semibold text-rose-600 dark:text-rose-400 text-sm">
            -{m.quantity}
          </span>
        );
      default:
        return <span className="font-semibold text-sm">{m.quantity}</span>;
    }
  };

  return (
    <>
      <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="font-semibold text-xs py-3.5">Movement #</TableHead>
                <TableHead className="font-semibold text-xs py-3.5">Type</TableHead>
                <TableHead className="font-semibold text-xs py-3.5">Item</TableHead>
                <TableHead className="font-semibold text-xs py-3.5">Locations</TableHead>
                <TableHead className="font-semibold text-xs py-3.5 text-center">Quantity</TableHead>
                <TableHead className="font-semibold text-xs py-3.5">Date & Time</TableHead>
                <TableHead className="font-semibold text-xs py-3.5">Notes & Evidence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableLoading colSpan={7} />
              ) : movements.length === 0 ? (
                <TableEmpty
                  colSpan={7}
                  message="No stock movements recorded yet. Movements appear when intake, distribution, transfer, or adjustments take place."
                />
              ) : (
                movements.map((m) => {
                  const item = m.inventoryItem;
                  const unit = m.inventoryUnit;
                  const hasPhotos = m.photos && m.photos.length > 0;

                  return (
                    <TableRow key={m.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="py-3 font-mono text-xs font-semibold text-foreground">
                        {m.movementNumber}
                      </TableCell>

                      <TableCell className="py-3">
                        {getMovementTypeBadge(m.type)}
                      </TableCell>

                      <TableCell className="py-3">
                        <div>
                          <p className="font-medium text-xs text-foreground">
                            {item?.name || "Unknown Item"}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                            <span className="font-mono">{item?.code}</span>
                            {unit && (
                              <Badge variant="outline" className="font-mono text-[10px] px-1 py-0">
                                Tag: {unit.uniqueCode}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-3">
                        <div className="text-xs space-y-0.5">
                          {m.fromLocation && m.toLocation ? (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <span>{m.fromLocation.name}</span>
                              <ArrowRight className="size-3 text-primary shrink-0" />
                              <span className="font-medium text-foreground">{m.toLocation.name}</span>
                            </div>
                          ) : m.fromLocation ? (
                            <div className="text-muted-foreground">
                              From: <span className="font-medium text-foreground">{m.fromLocation.name}</span>
                            </div>
                          ) : m.toLocation ? (
                            <div className="text-muted-foreground">
                              To: <span className="font-medium text-foreground">{m.toLocation.name}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">Direct Adjust</span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="py-3 text-center">
                        {getQuantityDisplay(m)}
                        <span className="text-[11px] text-muted-foreground ml-1">
                          {item?.unitName || "pcs"}
                        </span>
                      </TableCell>

                      <TableCell className="py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {m.createdAt
                          ? new Date(m.createdAt).toLocaleString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "N/A"}
                      </TableCell>

                      <TableCell className="py-3 text-xs">
                        <div className="flex items-center justify-between gap-2 max-w-xs">
                          <p className="truncate text-muted-foreground" title={m.notes || ""}>
                            {m.notes || "—"}
                          </p>
                          {hasPhotos && (
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              title="View photo evidence"
                              onClick={() => setSelectedPhoto(m.photos![0].imageUrl)}
                              className="shrink-0 text-primary hover:bg-primary/10"
                            >
                              <ImageIcon className="size-3.5" />
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

      {/* Photo Preview Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]">
          <DialogHeader className="p-4 border-b bg-card shrink-0">
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <ImageIcon className="size-4 text-primary" />
              Movement Evidence Photo
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
            {selectedPhoto && (
              <img
                src={selectedPhoto}
                alt="Stock Movement Evidence"
                className="max-h-[60vh] w-auto rounded-md object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
