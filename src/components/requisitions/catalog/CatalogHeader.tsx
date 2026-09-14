"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRequisitionCart } from "@/context/RequisitionCartContext";
import { ArrowLeft, ShoppingBag, Sparkles, Layers } from "lucide-react";

export default function CatalogHeader() {
  const { totalItems, totalUnits, setIsCartOpen } = useRequisitionCart();

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/60">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link
            href="/requisitions"
            className="flex items-center gap-1 hover:text-foreground transition-colors font-medium"
          >
            <ArrowLeft className="size-3.5" />
            <span>Requisitions</span>
          </Link>
          <span>/</span>
          <span className="text-foreground font-semibold flex items-center gap-1">
            <Sparkles className="size-3 text-primary" />
            Inventory Catalog & Storefront
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Layers className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Institutional Asset Catalog
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Select items, add them to your request cart, and submit as a departmental Requisition, Procurement Order, or Gift.
            </p>
          </div>
        </div>
      </div>

      {/* Cart Drawer Trigger Button */}
      <div className="flex items-center gap-2 self-start md:self-auto">
        <Button
          onClick={() => setIsCartOpen(true)}
          className="relative gap-2.5 px-4 py-2.5 shadow-sm font-semibold transition-all hover:scale-[1.02]"
          size="default"
        >
          <div className="relative">
            <ShoppingBag className="size-4" />
            {totalItems > 0 && (
              <span className="absolute -top-2.5 -right-2.5 flex size-4.5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs animate-in zoom-in">
                {totalItems}
              </span>
            )}
          </div>
          <span>Review Request Cart</span>
          {totalUnits > 0 && (
            <Badge
              variant="secondary"
              className="ml-1 bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30 text-[11px] font-mono px-1.5 py-0"
            >
              {totalUnits} units
            </Badge>
          )}
        </Button>
      </div>
    </div>
  );
}
