"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TableEmpty from "@/components/shared/TableEmpty";
import TableLoading from "@/components/shared/TableLoading";
import { TInventoryItem } from "@/type";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Package,
  QrCode,
  Layers,
  RotateCcw,
  Eye,
  ShoppingBag,
  CheckCircle2,
} from "lucide-react";
import { usePermission } from "@/hooks/usePermission";
import { useRequisitionCart } from "@/context/RequisitionCartContext";
import Link from "next/link";

interface ItemTableProps {
  items: TInventoryItem[];
  isLoading: boolean;
  onEdit: (item: TInventoryItem) => void;
  onDelete: (id: string, name: string) => void;
  onViewDetails?: (item: TInventoryItem) => void;
  stockMap?: Record<string, number>;
}

export default function ItemTable({
  items,
  isLoading,
  onEdit,
  onDelete,
  onViewDetails,
  stockMap = {},
}: ItemTableProps) {
  const { can } = usePermission();
  const { cart, addToCart } = useRequisitionCart();

  const canUpdate = can("inventory.update");
  const canDelete = can("inventory.delete");
  const canRequest = can("requisition.create");

  return (
    <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-2xs">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="w-[120px] font-semibold text-xs">Item Code</TableHead>
            <TableHead className="font-semibold text-xs">Name & Model</TableHead>
            <TableHead className="hidden md:table-cell font-semibold text-xs">
              Category
            </TableHead>
            <TableHead className="font-semibold text-xs">Tracking & Stock</TableHead>
            <TableHead className="hidden sm:table-cell font-semibold text-xs">
              UoM
            </TableHead>
            <TableHead className="hidden lg:table-cell font-semibold text-xs">
              Min / Reorder
            </TableHead>
            <TableHead className="w-[110px] text-right font-semibold text-xs">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading ? (
            <TableLoading colSpan={7} />
          ) : items.length === 0 ? (
            <TableEmpty colSpan={7} />
          ) : (
            items.map((item) => (
              <TableRow key={item.id} className="hover:bg-muted/30">
                <TableCell>
                  <Badge variant="outline" className="font-mono text-xs">
                    {item.code}
                  </Badge>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2">
                    <Package className="size-4 text-primary shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-xs text-foreground truncate">
                        {item.name}
                      </span>
                      {(item.brand || item.model) && (
                        <span className="text-[11px] text-muted-foreground truncate">
                          {[item.brand, item.model].filter(Boolean).join(" • ")}
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>

                <TableCell className="hidden md:table-cell">
                  {item.category ? (
                    <Badge variant="secondary" className="text-xs font-normal gap-1">
                      <Layers className="size-3" />
                      {item.category.name}
                    </Badge>
                  ) : (
                    "—"
                  )}
                </TableCell>

                <TableCell>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge
                      variant={
                        item.trackingType === "SERIALIZED"
                          ? "default"
                          : "outline"
                      }
                      className="text-[10px] font-normal"
                    >
                      {item.trackingType === "SERIALIZED" ? "Serialized" : "Bulk"}
                    </Badge>

                    {item.defaultIssuePolicy === "GIFT" ? (
                      <Badge className="bg-purple-600 text-white text-[10px] py-0 px-1 font-normal">
                        Gift
                      </Badge>
                    ) : item.isReturnable || item.defaultIssuePolicy === "TEMPORARY" ? (
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-normal text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/60"
                        title="Returnable item"
                      >
                        <RotateCcw className="size-2.5 mr-0.5" />
                        Loan
                      </Badge>
                    ) : null}

                    {/* Stock Count Pill */}
                    {(() => {
                      const avail =
                        stockMap[item.id] ??
                        item.availableStock ??
                        item.totalStock ??
                        0;
                      if (avail > 0) {
                        return (
                          <Badge
                            variant="outline"
                            className="text-[10px] border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 font-mono py-0 px-1"
                          >
                            {avail} {item.unitName || "unit"}
                          </Badge>
                        );
                      }
                      return (
                        <Badge
                          variant="outline"
                          className="text-[10px] border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 py-0 px-1"
                        >
                          Out of stock
                        </Badge>
                      );
                    })()}
                  </div>
                </TableCell>

                <TableCell className="hidden sm:table-cell text-xs text-muted-foreground font-mono">
                  {item.unitName || "Piece"}
                </TableCell>

                <TableCell className="hidden lg:table-cell text-xs text-muted-foreground font-mono">
                  {item.minimumStock} / {item.reorderLevel}
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {onViewDetails && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewDetails(item)}
                        className="size-8 text-muted-foreground hover:text-foreground"
                        title="View Full Item Details"
                      >
                        <Eye className="size-4" />
                      </Button>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-foreground"
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        {onViewDetails && (
                          <DropdownMenuItem
                            onClick={() => onViewDetails(item)}
                            className="cursor-pointer"
                          >
                            <Eye className="mr-2 size-4" />
                            <span>View Details</span>
                          </DropdownMenuItem>
                        )}
                        {canRequest && (
                          <DropdownMenuItem
                            onClick={() => addToCart(item, 1)}
                            className="cursor-pointer text-primary"
                          >
                            <ShoppingBag className="mr-2 size-4" />
                            <span>Add to Request Cart</span>
                          </DropdownMenuItem>
                        )}
                        {canUpdate && (
                          <DropdownMenuItem
                            onClick={() => onEdit(item)}
                            className="cursor-pointer"
                          >
                            <Edit className="mr-2 size-4" />
                            <span>Edit Item</span>
                          </DropdownMenuItem>
                        )}
                        {item.trackingType === "SERIALIZED" && (
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/inventory-units?itemId=${item.id}`}
                              className="cursor-pointer flex items-center"
                            >
                              <QrCode className="mr-2 size-4" />
                              <span>View Units</span>
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {canDelete && (
                          <DropdownMenuItem
                            onClick={() => onDelete(item.id, item.name)}
                            className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                          >
                            <Trash2 className="mr-2 size-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
