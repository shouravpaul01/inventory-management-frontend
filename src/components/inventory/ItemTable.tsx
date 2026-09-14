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
} from "lucide-react";
import { usePermission } from "@/hooks/usePermission";
import Link from "next/link";

interface ItemTableProps {
  items: TInventoryItem[];
  isLoading: boolean;
  onEdit: (item: TInventoryItem) => void;
  onDelete: (id: string, name: string) => void;
}

export default function ItemTable({
  items,
  isLoading,
  onEdit,
  onDelete,
}: ItemTableProps) {
  const { can } = usePermission();

  const canUpdate = can("inventory.update");
  const canDelete = can("inventory.delete");

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
            <TableHead className="font-semibold text-xs">Tracking</TableHead>
            <TableHead className="hidden sm:table-cell font-semibold text-xs">
              UoM
            </TableHead>
            <TableHead className="hidden lg:table-cell font-semibold text-xs">
              Min / Reorder
            </TableHead>
            {(canUpdate || canDelete) && (
              <TableHead className="w-[70px] text-right font-semibold text-xs">
                Actions
              </TableHead>
            )}
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
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant={
                        item.trackingType === "SERIALIZED"
                          ? "default"
                          : "outline"
                      }
                      className="text-[10px] font-normal"
                    >
                      {item.trackingType === "SERIALIZED" ? "Serialized Unit" : "Bulk Stock"}
                    </Badge>

                    {item.isReturnable && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-normal text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/60"
                        title="Returnable item"
                      >
                        <RotateCcw className="size-2.5 mr-0.5" />
                        Loan
                      </Badge>
                    )}
                  </div>
                </TableCell>

                <TableCell className="hidden sm:table-cell text-xs text-muted-foreground font-mono">
                  {item.unitName || "Piece"}
                </TableCell>

                <TableCell className="hidden lg:table-cell text-xs text-muted-foreground font-mono">
                  {item.minimumStock} / {item.reorderLevel}
                </TableCell>

                {(canUpdate || canDelete) && (
                  <TableCell className="text-right">
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
                      <DropdownMenuContent align="end" className="w-40">
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
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
