"use client";

import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useRequisitionCart } from "@/context/RequisitionCartContext";
import { TIssuePolicy } from "@/type";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Layers,
  Clock,
  Gift,
  ArrowRight,
  PackageOpen,
  MessageSquare,
} from "lucide-react";

interface RequisitionCartDrawerProps {
  onProceedToCheckout: () => void;
}

export default function RequisitionCartDrawer({
  onProceedToCheckout,
}: RequisitionCartDrawerProps) {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    updatePolicy,
    updateRemarks,
    clearCart,
    totalItems,
    totalUnits,
  } = useRequisitionCart();

  const handleCheckout = () => {
    setIsCartOpen(false);
    onProceedToCheckout();
  };

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg p-0 flex flex-col gap-0 border-l border-border/80 shadow-2xl"
      >
        {/* Drawer Header */}
        <SheetHeader className="p-5 border-b border-border/60 shrink-0 bg-muted/20">
          <div className="flex items-center justify-between pr-6">
            <SheetTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <ShoppingBag className="size-5 text-primary" />
              <span>Material Request Cart</span>
            </SheetTitle>
            <Badge variant="secondary" className="font-mono text-xs">
              {totalItems} {totalItems === 1 ? "item" : "items"}
            </Badge>
          </div>
          <SheetDescription className="text-xs text-muted-foreground text-left">
            Review your selected supplies, configure issuance policies, and add item remarks.
          </SheetDescription>
        </SheetHeader>

        {/* Drawer Body - Scrollable Items */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
              <div className="size-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground/60 border border-border/60">
                <PackageOpen className="size-8" />
              </div>
              <div className="space-y-1 max-w-xs">
                <h4 className="text-sm font-semibold text-foreground">
                  Your Request Cart is Empty
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Browse the asset catalog and click "Add to Request" on items needed for your department.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCartOpen(false)}
                className="mt-2 text-xs"
              >
                Continue Browsing Catalog
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((cartItem) => {
                const { item, quantity, policy, remarks } = cartItem;

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-border/70 bg-card hover:border-border transition-colors space-y-3"
                  >
                    {/* Item Row Header */}
                    <div className="flex items-start gap-3">
                      <div className="relative size-12 rounded-lg bg-muted border border-border/60 overflow-hidden shrink-0 flex items-center justify-center text-muted-foreground">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <span className="text-xs font-mono font-bold uppercase">
                            {item.code.slice(0, 3)}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-foreground line-clamp-1">
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground mt-0.5">
                          <span>#{item.code}</span>
                          {item.category?.name && (
                            <>
                              <span>•</span>
                              <span className="text-foreground/80">{item.category.name}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Remove item button */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(item.id)}
                        className="size-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 shrink-0"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>

                    {/* Quantity and Policy Selectors */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40">
                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-muted-foreground font-medium">
                          Qty:
                        </span>
                        <div className="flex items-center border border-border/80 bg-muted/20 rounded-md p-0.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={quantity <= 1}
                            onClick={() => updateQuantity(item.id, quantity - 1)}
                            className="size-6 hover:bg-background text-muted-foreground disabled:opacity-30"
                          >
                            <Minus className="size-3" />
                          </Button>
                          <span className="w-8 text-center text-xs font-bold font-mono text-foreground">
                            {quantity}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => updateQuantity(item.id, quantity + 1)}
                            className="size-6 hover:bg-background text-muted-foreground"
                          >
                            <Plus className="size-3" />
                          </Button>
                        </div>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {item.unitName || "unit"}
                        </span>
                      </div>

                      {/* Line Issue Policy Button Group */}
                      <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border border-border/60">
                        <button
                          type="button"
                          onClick={() => updatePolicy(item.id, "PERMANENT")}
                          className={`px-2 py-1 text-[10px] font-semibold rounded-md transition-all flex items-center gap-1 ${
                            policy === "PERMANENT"
                              ? "bg-primary text-primary-foreground shadow-2xs"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Layers className="size-2.5" />
                          Permanent
                        </button>
                        <button
                          type="button"
                          onClick={() => updatePolicy(item.id, "TEMPORARY")}
                          className={`px-2 py-1 text-[10px] font-semibold rounded-md transition-all flex items-center gap-1 ${
                            policy === "TEMPORARY"
                              ? "bg-amber-600 text-white shadow-2xs"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Clock className="size-2.5" />
                          Loan
                        </button>
                        <button
                          type="button"
                          onClick={() => updatePolicy(item.id, "GIFT")}
                          className={`px-2 py-1 text-[10px] font-semibold rounded-md transition-all flex items-center gap-1 ${
                            policy === "GIFT"
                              ? "bg-purple-600 text-white shadow-2xs"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Gift className="size-2.5" />
                          Gift
                        </button>
                      </div>
                    </div>

                    {/* Optional Item Remarks / Notes */}
                    <div className="pt-1">
                      <div className="relative">
                        <MessageSquare className="absolute left-2.5 top-2.5 size-3 text-muted-foreground/60" />
                        <Input
                          type="text"
                          value={remarks || ""}
                          onChange={(e) => updateRemarks(item.id, e.target.value)}
                          placeholder="Optional specifications or purpose for this line..."
                          className="h-8 pl-7 text-[11px] bg-muted/20 border-border/60 placeholder:text-muted-foreground/60"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Drawer Footer - Summary & Checkout Action */}
        {cart.length > 0 && (
          <SheetFooter className="p-5 border-t border-border/60 shrink-0 bg-muted/20 flex flex-col gap-3">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Unique Selected Items</span>
                <span className="font-mono font-medium text-foreground">{totalItems}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Total Quantity Units</span>
                <span className="font-mono font-bold text-foreground">{totalUnits} units</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearCart}
                className="text-xs text-muted-foreground hover:text-destructive hover:border-destructive/40"
              >
                Clear Cart
              </Button>
              <Button
                type="button"
                onClick={handleCheckout}
                className="flex-1 gap-2 font-semibold text-xs shadow-xs"
              >
                <span>Proceed to Requisition Checkout</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
