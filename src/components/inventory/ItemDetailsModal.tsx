"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  Layers,
  MapPin,
  QrCode,
  RotateCcw,
  Gift,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShoppingBag,
  Plus,
  Minus,
  ExternalLink,
  Edit,
  Tag,
  Boxes,
  ShieldCheck,
  Building,
} from "lucide-react";
import { useGetItemByIdQuery } from "@/redux/api/itemApi";
import { usePermission } from "@/hooks/usePermission";
import { useRequisitionCart } from "@/context/RequisitionCartContext";
import { TInventoryItem, TIssuePolicy } from "@/type";

interface ItemDetailsModalProps {
  itemId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (item: TInventoryItem) => void;
}

export default function ItemDetailsModal({
  itemId,
  open,
  onOpenChange,
  onEdit,
}: ItemDetailsModalProps) {
  const { can } = usePermission();
  const { cart, addToCart, updateQuantity, removeFromCart, setIsCartOpen } =
    useRequisitionCart();

  const [selectedQty, setSelectedQty] = useState(1);
  const [selectedPolicy, setSelectedPolicy] = useState<TIssuePolicy>("PERMANENT");

  const { data: itemData, isLoading } = useGetItemByIdQuery(itemId || "", {
    skip: !itemId || !open,
  });

  const item = (itemData?.data as any) || null;

  // Sync default policy when item changes
  useState(() => {
    if (item?.defaultIssuePolicy) {
      setSelectedPolicy(item.defaultIssuePolicy);
    }
  });

  const cartItem = item ? cart.find((ci) => ci.item.id === item.id) : null;
  const isInCart = Boolean(cartItem);

  // Compute total available stock across all stock balances
  const stockBalances = item?.stockBalances || [];
  const totalAvailableStock = stockBalances.reduce(
    (sum: number, sb: any) => sum + (sb.availableQuantity ?? sb.quantity ?? 0),
    0
  );
  const totalOnHandStock = stockBalances.reduce(
    (sum: number, sb: any) => sum + (sb.quantity ?? 0),
    0
  );
  const totalReservedStock = stockBalances.reduce(
    (sum: number, sb: any) => sum + (sb.reservedQuantity ?? 0),
    0
  );

  const effectiveStock =
    totalAvailableStock > 0
      ? totalAvailableStock
      : typeof item?.availableStock === "number"
      ? item.availableStock
      : 0;

  const isOutOfStock = effectiveStock <= 0;
  const isLowStock =
    effectiveStock > 0 && effectiveStock <= (item?.reorderLevel || 5);

  const handleAddToCart = () => {
    if (!item) return;
    addToCart(item, selectedQty);
    setSelectedQty(1);
  };

  const handleIncrement = () => {
    if (isInCart && item) {
      updateQuantity(item.id, cartItem!.quantity + 1);
    } else {
      setSelectedQty((prev) => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (isInCart && item) {
      if (cartItem!.quantity > 1) {
        updateQuantity(item.id, cartItem!.quantity - 1);
      } else {
        removeFromCart(item.id);
      }
    } else {
      setSelectedQty((prev) => Math.max(1, prev - 1));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl lg:max-w-3xl max-h-[92vh] p-0 gap-0 overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="p-5 pb-3 border-b bg-card shrink-0">
          <div className="flex items-center justify-between gap-4 pr-6">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Package className="size-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <DialogTitle className="text-base font-bold text-foreground truncate">
                  {isLoading ? (
                    <Skeleton className="h-5 w-48" />
                  ) : (
                    item?.name || "Inventory Item Details"
                  )}
                </DialogTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                  <span>Code: #{item?.code || "—"}</span>
                  {item?.sku && <span>• SKU: {item.sku}</span>}
                </div>
              </div>
            </div>

            {/* Quick Status Badges */}
            <div className="flex items-center gap-2 shrink-0">
              {item?.isActive === false ? (
                <Badge variant="destructive" className="text-xs">
                  Archived / Inactive
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-xs font-normal border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20"
                >
                  <ShieldCheck className="size-3 mr-1" />
                  Active Catalog
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-44 w-full rounded-xl" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          ) : !item ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              Unable to load item details.
            </div>
          ) : (
            <>
              {/* Hero Banner / Specs Section */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                {/* Image Preview */}
                <div className="md:col-span-5 relative h-48 w-full rounded-xl overflow-hidden border border-border/80 bg-muted/30 flex items-center justify-center">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 300px"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground gap-2 p-4 text-center">
                      <Package className="size-12 stroke-[1.25] text-muted-foreground/60" />
                      <span className="text-xs font-mono uppercase text-muted-foreground/80">
                        {item.code}
                      </span>
                    </div>
                  )}

                  {/* Stock Status Pill Overlay */}
                  <div className="absolute bottom-2.5 right-2.5">
                    {isOutOfStock ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-rose-950/85 text-rose-300 border border-rose-800/60 px-2.5 py-1 text-xs font-semibold backdrop-blur-md">
                        <AlertTriangle className="size-3" />
                        Out of Stock
                      </span>
                    ) : isLowStock ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-950/85 text-amber-300 border border-amber-800/60 px-2.5 py-1 text-xs font-semibold backdrop-blur-md">
                        <Clock className="size-3" />
                        Low Stock ({effectiveStock} {item.unitName})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-950/85 text-emerald-300 border border-emerald-800/60 px-2.5 py-1 text-xs font-semibold backdrop-blur-md">
                        <CheckCircle2 className="size-3" />
                        Available: {effectiveStock} {item.unitName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Key Attributes Grid */}
                <div className="md:col-span-7 flex flex-col justify-between space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-2.5 rounded-lg border border-border/60 bg-muted/20 space-y-0.5">
                      <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                        <Layers className="size-3" />
                        Category
                      </span>
                      <p className="text-xs font-semibold text-foreground truncate">
                        {item.category?.name || "Uncategorized"}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg border border-border/60 bg-muted/20 space-y-0.5">
                      <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                        <Tag className="size-3" />
                        Brand & Model
                      </span>
                      <p className="text-xs font-semibold text-foreground truncate">
                        {[item.brand, item.model].filter(Boolean).join(" - ") || "Generic"}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg border border-border/60 bg-muted/20 space-y-0.5">
                      <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                        <Boxes className="size-3" />
                        Tracking Method
                      </span>
                      <Badge
                        variant={item.trackingType === "SERIALIZED" ? "default" : "outline"}
                        className="text-[10px] font-medium mt-0.5"
                      >
                        {item.trackingType === "SERIALIZED"
                          ? "Serialized Physical Assets"
                          : "Bulk Consumables"}
                      </Badge>
                    </div>

                    <div className="p-2.5 rounded-lg border border-border/60 bg-muted/20 space-y-0.5">
                      <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                        <RotateCcw className="size-3" />
                        Allocation Policy
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        {item.defaultIssuePolicy === "GIFT" ? (
                          <Badge className="bg-purple-600 text-white text-[10px] gap-1 px-1.5">
                            <Gift className="size-3" />
                            Gift / Permanent
                          </Badge>
                        ) : item.defaultIssuePolicy === "TEMPORARY" || item.isReturnable ? (
                          <Badge className="bg-amber-600 text-white text-[10px] gap-1 px-1.5">
                            <Clock className="size-3" />
                            Returnable Loan
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-600 text-white text-[10px] gap-1 px-1.5">
                            Permanent Issue
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg border border-border/60 bg-muted/20 space-y-0.5">
                      <span className="text-[11px] text-muted-foreground font-medium">
                        Unit of Measure (UoM)
                      </span>
                      <p className="text-xs font-semibold text-foreground">
                        {item.unitName || "Piece"}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg border border-border/60 bg-muted/20 space-y-0.5">
                      <span className="text-[11px] text-muted-foreground font-medium">
                        Min / Reorder Threshold
                      </span>
                      <p className="text-xs font-semibold text-foreground font-mono">
                        {item.minimumStock} / {item.reorderLevel}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  {item.description && (
                    <div className="p-3 rounded-lg border border-border/50 bg-card text-xs text-muted-foreground leading-relaxed">
                      <span className="font-semibold text-foreground block mb-0.5">
                        Item Specification & Description:
                      </span>
                      {item.description}
                    </div>
                  )}
                </div>
              </div>

              {/* Stock Balances Across Locations */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 text-primary" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Store & Storage Location Balances
                    </h4>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    Total On-Hand: <strong className="text-foreground">{totalOnHandStock}</strong> (Available:{" "}
                    <strong className="text-emerald-600 dark:text-emerald-400">{effectiveStock}</strong>
                    {totalReservedStock > 0 && `, Reserved: ${totalReservedStock}`})
                  </span>
                </div>

                {stockBalances.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/80 p-5 text-center text-xs text-muted-foreground bg-muted/10">
                    No active stock balance records found for this catalog item in any campus location.
                  </div>
                ) : (
                  <div className="rounded-xl border border-border/70 overflow-hidden bg-card shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground font-semibold">
                        <tr>
                          <th className="p-2.5 pl-3">Storage Location</th>
                          <th className="p-2.5">Facility / Building</th>
                          <th className="p-2.5 text-center">On Hand</th>
                          <th className="p-2.5 text-center">Reserved</th>
                          <th className="p-2.5 pr-3 text-right">Available</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {stockBalances.map((sb: any) => (
                          <tr key={sb.id} className="hover:bg-muted/20">
                            <td className="p-2.5 pl-3">
                              <div className="flex flex-col">
                                <span className="font-medium text-foreground">
                                  {sb.location?.name || "Central Store"}
                                </span>
                                <span className="font-mono text-[10px] text-muted-foreground">
                                  {sb.location?.code}
                                </span>
                              </div>
                            </td>
                            <td className="p-2.5 text-muted-foreground">
                              {sb.location?.building?.name ||
                                sb.location?.room?.name ||
                                "Main Facility"}
                            </td>
                            <td className="p-2.5 text-center font-mono font-medium">
                              {sb.quantity}
                            </td>
                            <td className="p-2.5 text-center font-mono text-amber-600 dark:text-amber-400">
                              {sb.reservedQuantity || 0}
                            </td>
                            <td className="p-2.5 pr-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {sb.availableQuantity ?? sb.quantity ?? 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Serialized Unit Statistics (if trackingType === "SERIALIZED") */}
              {item.trackingType === "SERIALIZED" && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <QrCode className="size-4 text-primary" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Physical Serialized Units Summary
                      </h4>
                    </div>

                    <Link
                      href={`/inventory-units?itemId=${item.id}`}
                      className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                    >
                      <span>Explore Physical Units</span>
                      <ExternalLink className="size-3" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-2.5 rounded-lg border border-border/60 bg-muted/15 text-center">
                      <span className="text-[10px] text-muted-foreground block font-medium">
                        Total Registered
                      </span>
                      <span className="text-sm font-bold font-mono text-foreground">
                        {item._count?.units || item.unitStats?.total || 0}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-950/20 text-center">
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block font-medium">
                        In Stock (Ready)
                      </span>
                      <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {item.unitStats?.inStock ?? item.unitStats?.available ?? effectiveStock}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-blue-500/20 bg-blue-50/30 dark:bg-blue-950/20 text-center">
                      <span className="text-[10px] text-blue-700 dark:text-blue-300 block font-medium">
                        Issued / On Loan
                      </span>
                      <span className="text-sm font-bold font-mono text-blue-600 dark:text-blue-400">
                        {item.unitStats?.issued ?? item.unitStats?.allocated ?? 0}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-amber-500/20 bg-amber-50/30 dark:bg-amber-950/20 text-center">
                      <span className="text-[10px] text-amber-700 dark:text-amber-300 block font-medium">
                        In Maintenance
                      </span>
                      <span className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400">
                        {item.unitStats?.maintenance ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions & Cart Integration */}
        <DialogFooter className="p-4 border-t bg-card shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {can("inventory.update") && onEdit && item && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onEdit(item);
                }}
                className="gap-1.5 text-xs shadow-2xs"
              >
                <Edit className="size-3.5" />
                <span>Edit Item</span>
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Close
            </Button>
          </div>

          {/* Add to Cart Controller for Requesters */}
          {can("requisition.create") && item && (
            <div className="flex items-center gap-3">
              {isInCart ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-primary/40 bg-background rounded-lg p-0.5 shadow-2xs">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleDecrement}
                      className="size-7 hover:bg-muted text-muted-foreground hover:text-foreground"
                    >
                      <Minus className="size-3.5" />
                    </Button>
                    <span className="w-8 text-center text-xs font-bold font-mono text-primary">
                      {cartItem?.quantity}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleIncrement}
                      className="size-7 hover:bg-muted text-muted-foreground hover:text-foreground"
                    >
                      <Plus className="size-3.5" />
                    </Button>
                  </div>

                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => {
                      onOpenChange(false);
                      setIsCartOpen(true);
                    }}
                    className="gap-1.5 text-xs font-semibold shadow-xs"
                  >
                    <ShoppingBag className="size-3.5" />
                    <span>View in Request Cart</span>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {/* Stepper */}
                  <div className="flex items-center border border-border/80 bg-background rounded-lg p-0.5 shadow-2xs">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleDecrement}
                      disabled={selectedQty <= 1}
                      className="size-7 hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      <Minus className="size-3.5" />
                    </Button>
                    <span className="w-7 text-center text-xs font-bold font-mono text-foreground">
                      {selectedQty}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleIncrement}
                      className="size-7 hover:bg-muted text-muted-foreground hover:text-foreground"
                    >
                      <Plus className="size-3.5" />
                    </Button>
                  </div>

                  <Button
                    type="button"
                    onClick={handleAddToCart}
                    size="sm"
                    className="gap-1.5 text-xs font-semibold shadow-xs"
                  >
                    <ShoppingBag className="size-3.5" />
                    <span>Add to Request Cart</span>
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
