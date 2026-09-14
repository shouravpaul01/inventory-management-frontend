"use client";

import { useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRequisitionCart } from "@/context/RequisitionCartContext";
import { TInventoryItem } from "@/type";
import {
  Package,
  Plus,
  Minus,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  ShoppingBag,
  Gift,
  Clock,
  CheckCircle2,
  Tag,
} from "lucide-react";

interface CatalogItemCardProps {
  item: TInventoryItem;
  stockCount?: number;
}

export default function CatalogItemCard({ item, stockCount }: CatalogItemCardProps) {
  const { cart, addToCart, updateQuantity, removeFromCart } = useRequisitionCart();
  const [selectedQty, setSelectedQty] = useState(1);

  const cartItem = cart.find((ci) => ci.item.id === item.id);
  const isInCart = Boolean(cartItem);

  // Available stock count from balance or computed property
  const effectiveStock =
    typeof stockCount === "number"
      ? stockCount
      : typeof item.availableStock === "number"
      ? item.availableStock
      : typeof item.totalStock === "number"
      ? item.totalStock
      : 0;

  const isLowStock = effectiveStock > 0 && effectiveStock <= (item.reorderLevel || 5);
  const isOutOfStock = effectiveStock <= 0;

  const handleIncrement = () => {
    if (isInCart) {
      updateQuantity(item.id, cartItem!.quantity + 1);
    } else {
      setSelectedQty((prev) => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (isInCart) {
      if (cartItem!.quantity > 1) {
        updateQuantity(item.id, cartItem!.quantity - 1);
      } else {
        removeFromCart(item.id);
      }
    } else {
      setSelectedQty((prev) => Math.max(1, prev - 1));
    }
  };

  const handleAdd = () => {
    addToCart(item, selectedQty);
    setSelectedQty(1);
  };

  return (
    <div
      className={`group relative flex flex-col rounded-xl border bg-card transition-all duration-200 hover:shadow-md ${
        isInCart
          ? "border-primary/60 ring-1 ring-primary/40 shadow-xs bg-primary/[0.015]"
          : "border-border/70 hover:border-border"
      }`}
    >
      {/* Visual Header / Image Container */}
      <div className="relative h-44 w-full overflow-hidden rounded-t-xl bg-muted/40 border-b border-border/40">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 bg-radial from-muted/30 to-muted/80 text-muted-foreground p-4 text-center">
            <div className="size-12 rounded-xl bg-background/80 shadow-xs border border-border/60 flex items-center justify-center text-primary/80 group-hover:scale-110 transition-transform">
              <Package className="size-6" />
            </div>
            <span className="text-[11px] font-mono tracking-wider uppercase text-muted-foreground/70">
              {item.code}
            </span>
          </div>
        )}

        {/* Top Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 pointer-events-none">
          {/* Category Badge */}
          <Badge
            variant="secondary"
            className="text-[10px] font-semibold bg-background/90 backdrop-blur-md border border-border/50 text-foreground px-2 py-0.5 shadow-2xs"
          >
            {item.category?.name || "General Asset"}
          </Badge>

          {/* Issue Policy Badge */}
          {item.defaultIssuePolicy === "GIFT" ? (
            <Badge className="bg-purple-600/90 text-white text-[10px] gap-1 px-1.5 shadow-2xs backdrop-blur-md">
              <Gift className="size-3" />
              Gift Issue
            </Badge>
          ) : item.defaultIssuePolicy === "TEMPORARY" ? (
            <Badge className="bg-amber-600/90 text-white text-[10px] gap-1 px-1.5 shadow-2xs backdrop-blur-md">
              <Clock className="size-3" />
              Loan / Temp
            </Badge>
          ) : (
            <Badge className="bg-blue-600/90 text-white text-[10px] gap-1 px-1.5 shadow-2xs backdrop-blur-md">
              <Layers className="size-3" />
              Permanent
            </Badge>
          )}
        </div>

        {/* Stock Status Pill on Bottom Right of Image */}
        <div className="absolute bottom-2 right-2.5">
          {isOutOfStock ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-rose-950/80 text-rose-300 border border-rose-800/60 px-2 py-0.5 text-[10px] font-semibold backdrop-blur-md">
              Out of Stock (PO only)
            </span>
          ) : isLowStock ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-950/80 text-amber-300 border border-amber-800/60 px-2 py-0.5 text-[10px] font-semibold backdrop-blur-md">
              Low Stock: {effectiveStock} {item.unitName || "units"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 text-[10px] font-semibold backdrop-blur-md">
              Available: {effectiveStock} {item.unitName || "units"}
            </span>
          )}
        </div>
      </div>

      {/* Item Information Body */}
      <div className="flex flex-1 flex-col p-4 space-y-2.5">
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {item.name}
            </h3>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <span>#{item.code}</span>
            {item.sku && (
              <>
                <span>•</span>
                <span>SKU: {item.sku}</span>
              </>
            )}
          </div>
        </div>

        {/* Brand & Model tags */}
        {(item.brand || item.model) && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/90">
            <Tag className="size-3 text-muted-foreground" />
            <span className="line-clamp-1 font-medium">
              {[item.brand, item.model].filter(Boolean).join(" - ")}
            </span>
          </div>
        )}

        {/* Short description */}
        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}

        {/* Tracking & Returnable badges */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <Badge
            variant="outline"
            className="text-[10px] py-0 px-1.5 font-normal text-muted-foreground border-border/60"
          >
            {item.trackingType === "SERIALIZED" ? "Serialized Asset" : "Batch Non-Serialized"}
          </Badge>

          {item.isReturnable && (
            <Badge
              variant="outline"
              className="text-[10px] py-0 px-1.5 font-normal text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 gap-1 bg-amber-50/50 dark:bg-amber-950/20"
            >
              <RotateCcw className="size-2.5" />
              Returnable
            </Badge>
          )}
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="p-3 pt-0 border-t border-border/40 mt-auto bg-muted/10 rounded-b-xl">
        {isInCart ? (
          <div className="flex items-center justify-between gap-2 pt-2.5">
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

            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4" />
              <span>In Cart</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 pt-2.5">
            {/* Local Quantity Stepper before adding */}
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

            {/* Add to Cart Button */}
            <Button
              type="button"
              onClick={handleAdd}
              size="sm"
              className="flex-1 gap-1.5 text-xs font-semibold shadow-xs"
            >
              <ShoppingBag className="size-3.5" />
              <span>Add to Request</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
