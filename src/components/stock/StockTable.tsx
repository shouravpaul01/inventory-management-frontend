"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TableEmpty from "@/components/shared/TableEmpty";
import TableLoading from "@/components/shared/TableLoading";
import { TStockBalance } from "@/type";
import {
  ArrowRightLeft,
  SlidersHorizontal,
  PlusCircle,
  MinusCircle,
  AlertTriangle,
  Boxes,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { usePermission } from "@/hooks/usePermission";

interface StockTableProps {
  balances: TStockBalance[];
  isLoading: boolean;
  onStockIn?: (balance: TStockBalance) => void;
  onStockOut?: (balance: TStockBalance) => void;
  onTransfer?: (balance: TStockBalance) => void;
  onAdjust?: (balance: TStockBalance) => void;
}

export default function StockTable({
  balances,
  isLoading,
  onStockIn,
  onStockOut,
  onTransfer,
  onAdjust,
}: StockTableProps) {
  const { can } = usePermission();
  const canStockIn = can("stock.in");
  const canStockOut = can("stock.out");
  const canTransfer = can("stock.transfer");
  const canAdjust = can("stock.adjust");

  return (
    <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="font-semibold text-xs py-3.5">Item Details</TableHead>
              <TableHead className="font-semibold text-xs py-3.5">Category & Type</TableHead>
              <TableHead className="font-semibold text-xs py-3.5">Location</TableHead>
              <TableHead className="font-semibold text-xs py-3.5 text-center">On Hand</TableHead>
              <TableHead className="font-semibold text-xs py-3.5 text-center">Reserved</TableHead>
              <TableHead className="font-semibold text-xs py-3.5 text-center">Available</TableHead>
              <TableHead className="font-semibold text-xs py-3.5 text-center">Stock Health</TableHead>
              {(canStockIn || canStockOut || canTransfer || canAdjust) && (
                <TableHead className="font-semibold text-xs py-3.5 text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableLoading colSpan={8} />
            ) : balances.length === 0 ? (
              <TableEmpty
                colSpan={8}
                message="No stock balance records found. Add stock intake or adjust existing inventory to view balances."
              />
            ) : (
              balances.map((b) => {
                const item = b.inventoryItem || b.item;
                const location = b.location;
                const minStock = item?.minimumStock ?? 0;
                const isLowStock = b.availableQuantity <= minStock;
                const isOutOfStock = b.availableQuantity <= 0;

                return (
                  <TableRow key={b.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                          <Boxes className="size-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground">
                            {item?.name || "Unknown Item"}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span className="font-mono">{item?.code}</span>
                            {item?.sku && <span>• SKU: {item.sku}</span>}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-3">
                      <div className="space-y-1">
                        <Badge variant="outline" className="text-xs">
                          {item?.category?.name || "General"}
                        </Badge>
                        <div className="text-[11px] text-muted-foreground">
                          {item?.trackingType === "SERIALIZED" ? "Serialized Asset" : "Bulk / Consumable"}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-3">
                      <div className="flex items-center gap-1.5 text-sm">
                        <MapPin className="size-3.5 text-muted-foreground shrink-0" />
                        <div>
                          <p className="font-medium text-xs">{location?.name || "General Location"}</p>
                          {location?.room && (
                            <p className="text-[11px] text-muted-foreground">
                              Room: {location.room.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-3 text-center">
                      <span className="font-semibold text-sm">{b.quantity}</span>
                      <span className="text-xs text-muted-foreground ml-1">{item?.unitName || "units"}</span>
                    </TableCell>

                    <TableCell className="py-3 text-center">
                      <span className="font-medium text-xs text-muted-foreground">
                        {b.reservedQuantity}
                      </span>
                    </TableCell>

                    <TableCell className="py-3 text-center">
                      <span
                        className={`inline-flex items-center justify-center font-bold text-sm px-2.5 py-0.5 rounded-full ${
                          isOutOfStock
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                            : isLowStock
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        }`}
                      >
                        {b.availableQuantity}
                      </span>
                    </TableCell>

                    <TableCell className="py-3 text-center">
                      {isOutOfStock ? (
                        <Badge variant="destructive" className="gap-1 text-[10px]">
                          <AlertTriangle className="size-2.5" /> Out of Stock
                        </Badge>
                      ) : isLowStock ? (
                        <Badge
                          variant="secondary"
                          className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 gap-1 text-[10px]"
                        >
                          <AlertTriangle className="size-2.5" /> Low Stock (&le; {minStock})
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 gap-1 text-[10px]"
                        >
                          <CheckCircle2 className="size-2.5" /> Optimal
                        </Badge>
                      )}
                    </TableCell>

                    {(canStockIn || canStockOut || canTransfer || canAdjust) && (
                      <TableCell className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canStockIn && onStockIn && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="Stock In (Intake)"
                              onClick={() => onStockIn(b)}
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                            >
                              <PlusCircle className="size-4" />
                            </Button>
                          )}

                          {canStockOut && onStockOut && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="Stock Out (Write-off / Dispose)"
                              onClick={() => onStockOut(b)}
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950"
                            >
                              <MinusCircle className="size-4" />
                            </Button>
                          )}

                          {canTransfer && onTransfer && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="Transfer Location"
                              onClick={() => onTransfer(b)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                            >
                              <ArrowRightLeft className="size-4" />
                            </Button>
                          )}

                          {canAdjust && onAdjust && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="Reconcile / Adjust Stock"
                              onClick={() => onAdjust(b)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <SlidersHorizontal className="size-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
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
