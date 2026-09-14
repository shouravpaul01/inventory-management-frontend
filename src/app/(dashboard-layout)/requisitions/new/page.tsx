"use client";

import { useState, useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { usePermission } from "@/hooks/usePermission";
import { useGetItemsQuery } from "@/redux/api/itemApi";
import { useGetCategoriesQuery } from "@/redux/api/categoryApi";
import { useGetStockBalancesQuery } from "@/redux/api/stockApi";
import { RequisitionCartProvider, useRequisitionCart } from "@/context/RequisitionCartContext";
import CatalogHeader from "@/components/requisitions/catalog/CatalogHeader";
import CatalogFilterBar from "@/components/requisitions/catalog/CatalogFilterBar";
import CatalogItemCard from "@/components/requisitions/catalog/CatalogItemCard";
import RequisitionCartDrawer from "@/components/requisitions/catalog/RequisitionCartDrawer";
import RequisitionCheckoutDialog from "@/components/requisitions/catalog/RequisitionCheckoutDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/shared/EmptyState";
import { ShieldAlert, PackageOpen } from "lucide-react";

function RequisitionCatalogContent() {
  const { can } = usePermission();
  const { setIsCartOpen } = useRequisitionCart();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  const [selectedCategoryId, setSelectedCategoryId] = useState("ALL");
  const [policyFilter, setPolicyFilter] = useState("ALL");
  const [stockFilter, setStockFilter] = useState<"ALL" | "IN_STOCK" | "LOW_STOCK">("ALL");

  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // Queries
  const { data: categoriesData } = useGetCategoriesQuery({ limit: 100 });
  const categories = categoriesData?.data || [];

  const { data: itemsData, isLoading: isItemsLoading } = useGetItemsQuery({
    limit: 100,
    searchTerm: debouncedSearch || undefined,
    categoryId: selectedCategoryId !== "ALL" ? selectedCategoryId : undefined,
  });
  const items = itemsData?.data || [];

  // Stock balances query to compute aggregate available stock per item
  const { data: stockData } = useGetStockBalancesQuery({ limit: 200 });
  const stockBalances = stockData?.data || [];

  // Map of inventoryItemId -> total available stock count
  const stockMap = useMemo(() => {
    const map: Record<string, number> = {};
    stockBalances.forEach((sb) => {
      const itemId = sb.inventoryItemId || sb.itemId;
      if (itemId) {
        map[itemId] = (map[itemId] || 0) + (sb.availableQuantity ?? sb.quantity ?? 0);
      }
    });
    return map;
  }, [stockBalances]);

  // Client-side filtering for policy and stock status
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Policy filter
      if (policyFilter !== "ALL" && item.defaultIssuePolicy !== policyFilter) {
        return false;
      }

      // Stock status filter
      const available = stockMap[item.id] ?? item.availableStock ?? 0;
      if (stockFilter === "IN_STOCK" && available <= 0) {
        return false;
      }
      if (stockFilter === "LOW_STOCK") {
        const reorder = item.reorderLevel || 5;
        if (available <= 0 || available > reorder) {
          return false;
        }
      }

      return true;
    });
  }, [items, policyFilter, stockFilter, stockMap]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCategoryId("ALL");
    setPolicyFilter("ALL");
    setStockFilter("ALL");
  };

  if (!can("requisition.create")) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-2xl border border-border/80 shadow-sm space-y-3">
        <div className="size-12 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
          <ShieldAlert className="size-6" />
        </div>
        <h3 className="text-base font-bold text-foreground">Access Restricted</h3>
        <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
          You do not possess the required permission (<code className="font-mono text-primary">requisition.create</code>) to browse and submit institutional requisitions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <CatalogHeader />

      {/* Filter and Search Bar */}
      <CatalogFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onCategoryChange={setSelectedCategoryId}
        policyFilter={policyFilter}
        onPolicyFilterChange={setPolicyFilter}
        stockFilter={stockFilter}
        onStockFilterChange={setStockFilter}
        onReset={handleResetFilters}
        totalFiltered={filteredItems.length}
      />

      {/* Item Cards Grid */}
      {isItemsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="flex flex-col rounded-xl border border-border/60 bg-card p-3 space-y-3"
            >
              <Skeleton className="h-40 w-full rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-8 w-full mt-auto" />
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          title="No Inventory Items Found"
          description="No supplies match your active search criteria or filters. Try adjusting your query or resetting filters."
          icon={<PackageOpen className="size-10 text-muted-foreground" />}
          action={
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              Clear All Filters
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <CatalogItemCard
              key={item.id}
              item={item}
              stockCount={stockMap[item.id]}
            />
          ))}
        </div>
      )}

      {/* Slide-over Cart Drawer */}
      <RequisitionCartDrawer
        onProceedToCheckout={() => setCheckoutOpen(true)}
      />

      {/* Checkout Submission Dialog */}
      <RequisitionCheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        onBackToCart={() => {
          setCheckoutOpen(false);
          setIsCartOpen(true);
        }}
      />
    </div>
  );
}

export default function NewRequisitionPage() {
  return (
    <RequisitionCartProvider>
      <RequisitionCatalogContent />
    </RequisitionCartProvider>
  );
}
