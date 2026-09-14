"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { TInventoryItem, TIssuePolicy } from "@/type";
import { toast } from "sonner";

export type TCartItem = {
  item: TInventoryItem;
  quantity: number;
  policy: TIssuePolicy;
  remarks?: string;
};

interface RequisitionCartContextType {
  cart: TCartItem[];
  addToCart: (item: TInventoryItem, quantity?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updatePolicy: (itemId: string, policy: TIssuePolicy) => void;
  updateRemarks: (itemId: string, remarks: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalUnits: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const RequisitionCartContext = createContext<RequisitionCartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "requisition_catalog_cart_v1";

export function RequisitionCartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<TCartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setCart(JSON.parse(stored));
      }
    } catch {
      // Ignore storage errors
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Ignore storage quota errors
    }
  }, [cart, isHydrated]);

  const addToCart = (item: TInventoryItem, quantity = 1) => {
    const qty = Math.max(1, quantity);
    setCart((prev) => {
      const existingIndex = prev.findIndex((ci) => ci.item.id === item.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + qty,
        };
        toast.success(`Updated "${item.name}" quantity (${updated[existingIndex].quantity}) in cart`);
        return updated;
      }
      toast.success(`Added "${item.name}" (${qty} ${item.unitName || "unit"}) to cart`);
      return [
        ...prev,
        {
          item,
          quantity: qty,
          policy: (item.defaultIssuePolicy || "PERMANENT") as TIssuePolicy,
          remarks: "",
        },
      ];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const removed = prev.find((ci) => ci.item.id === itemId);
      if (removed) {
        toast.info(`Removed "${removed.item.name}" from request cart`);
      }
      return prev.filter((ci) => ci.item.id !== itemId);
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    const validQty = Math.max(1, Math.floor(quantity));
    setCart((prev) =>
      prev.map((ci) =>
        ci.item.id === itemId ? { ...ci, quantity: validQty } : ci
      )
    );
  };

  const updatePolicy = (itemId: string, policy: TIssuePolicy) => {
    setCart((prev) =>
      prev.map((ci) =>
        ci.item.id === itemId ? { ...ci, policy } : ci
      )
    );
  };

  const updateRemarks = (itemId: string, remarks: string) => {
    setCart((prev) =>
      prev.map((ci) =>
        ci.item.id === itemId ? { ...ci, remarks } : ci
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  const totalItems = cart.length;
  const totalUnits = cart.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <RequisitionCartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        updatePolicy,
        updateRemarks,
        clearCart,
        totalItems,
        totalUnits,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </RequisitionCartContext.Provider>
  );
}

export function useRequisitionCart() {
  const context = useContext(RequisitionCartContext);
  if (!context) {
    throw new Error("useRequisitionCart must be used within a RequisitionCartProvider");
  }
  return context;
}
