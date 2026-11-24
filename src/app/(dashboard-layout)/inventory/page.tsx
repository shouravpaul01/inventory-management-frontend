"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Package,
  RotateCcw,
  LayoutGrid,
  List,
  ShoppingBag,
  SlidersHorizontal,
  PackageSearch,
  CheckCircle2,
  Clock,
  Gift,
  Boxes,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SectionHeader from "@/components/shared/SectionHeader";
import SearchInput from "@/components/shared/SearchInput";
import FilterSelect from "@/components/shared/FilterSelect";
import Pagination from "@/components/shared/Pagination";
import ItemTable from "@/components/inventory/ItemTable";
import ItemModal from "@/components/inventory/ItemModal";
import ItemDetailsModal from "@/components/inventory/ItemDetailsModal";
import CatalogItemCard from "@/components/requisitions/catalog/CatalogItemCard";
import RequisitionCartDrawer from "@/components/requisitions/catalog/RequisitionCartDrawer";
import RequisitionCheckoutDialog from "@/components/requisitions/catalog/RequisitionCheckoutDialog";
import {
  RequisitionCartProvider,
  useRequisitionCart,
} from "@/context/RequisitionCartContext";
import {
  useGetItemsQuery,
  useDeleteItemMutation,
} from "@/redux/api/itemApi";
import { useGetCategoriesQuery } from "@/redux/api/categoryApi";
import { useGetStockBalancesQuery } from "@/redux/api/stockApi";
import { usePermission } from "@/hooks/usePermission";
import { useDebounce } from "@/hooks/useDebounce";
import { TInventoryItem, TTrackingType, TIssuePolicy } from "@/type";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

function InventoryPageContent() {
  const { can } = usePermission();
  const { totalItems, totalUnits, setIsCartOpen } = useRequisitionCart();

  // View mode: cards catalog vs compact table
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);

  const [categoryId, setCategoryId] = useState("");
  const [trackingType, setTrackingType] = useState<TTrackingType | "">("");
  const [policyFilter, setPolicyFilter] = useState<TIssuePolicy | "ALL">("ALL");
  const [stockFilter, setStockFilter] = useState<"ALL" | "IN_STOCK" | "LOW_STOCK">("ALL");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);

  // Modals state
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [selectedItemForEdit, setSelectedItemForEdit] =
    useState<TInventoryItem | null>(null);

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedItemDetailsId, setSelectedItemDetailsId] = useState<string | null>(
    null
  );

  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Queries
  const { data: categoriesData } = useGetCategoriesQuery({ limit: 100 });
  const categories = categoriesData?.data || [];

  const { data: stockData } = useGetStockBalancesQuery({ limit: 300 });
  const stockBalances = stockData?.data || [];

  // Map of inventoryItemId -> total available stock count across all locations
  const stockMap = useMemo(() => {
    const map: Record<string, number> = {};
    stockBalances.forEach((sb: any) => {
      const itemId = sb.inventoryItemId || sb.itemId;
      if (itemId) {
        map[itemId] =
          (map[itemId] || 0) + (sb.availableQuantity ?? sb.quantity ?? 0);
      }
    });
    return map;
  }, [stockBalances]);

  const { data, isLoading } = useGetItemsQuery({
    searchTerm: debouncedSearch || undefined,
    categoryId: categoryId || undefined,
    trackingType: (trackingType as TTrackingType) || undefined,
    page,
    limit,
  });

  const [deleteItem, { isLoading: isDeleting }] = useDeleteItemMutation();

  const rawItems = data?.data || [];
  const meta = data?.meta || {
    page: 1,
    limit: 12,
    total: 0,
    totalPage: 1,
  };

  // Client-side filtering for policy and stock status
  const displayedItems = useMemo(() => {
    return rawItems.filter((item) => {
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
  }, [rawItems, policyFilter, stockFilter, stockMap]);

  // Handlers
  const handleOpenCreate = () => {
    setSelectedItemForEdit(null);
    setItemModalOpen(true);
  };

  const handleOpenEdit = (item: TInventoryItem) => {
    setSelectedItemForEdit(item);
    setItemModalOpen(true);
  };

  const handleViewDetails = (item: TInventoryItem) => {
    setSelectedItemDetailsId(item.id);
    setDetailsModalOpen(true);
  };

  const handleOpenDelete = (id: string, name: string) => {
    setItemToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteItem(itemToDelete.id).unwrap();
      toast.success(`Item "${itemToDelete.name}" removed from catalog.`);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete item");
    }
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setCategoryId("");
    setTrackingType("");
    setPolicyFilter("ALL");
    setStockFilter("ALL");
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    searchTerm ||
      categoryId ||
      trackingType ||
      policyFilter !== "ALL" ||
      stockFilter !== "ALL"
  );

  return (
    <div className="space-y-6">
      {/* Top Header & Global Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <SectionHeader
          title="Institutional Inventory Catalog"
          description="Browse campus assets, examine detailed technical specifications, monitor live stock levels, and place material requests."
        />

        <div className="flex items-center gap-2.5 shrink-0">
          {/* Cart Trigger Button for Requesters */}
          {can("requisition.create") && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCartOpen(true)}
              className="relative gap-2 border-primary/30 hover:border-primary/60 bg-card shadow-2xs"
            >
              <ShoppingBag className="size-4 text-primary" />
              <span className="font-semibold text-xs">Request Cart</span>
              {totalItems > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {totalItems}
                </span>
              )}
            </Button>
          )}

          {/* Catalog New Item Button for Store Officers / Admins */}
          {can("inventory.create") && (
            <Button onClick={handleOpenCreate} className="gap-1.5 shadow-xs">
              <Plus className="size-4" />
              <span>Catalog New Item</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter & View Switcher Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search */}
          <div className="flex-1">
            <SearchInput
              value={searchTerm}
              onChange={(val) => {
                setSearchTerm(val);
                setPage(1);
              }}
              placeholder="Search items by name, code, SKU, or brand..."
            />
          </div>

          {/* Category Dropdown */}
          <div className="w-full sm:w-52">
            <FilterSelect
              placeholder="Category"
              value={categoryId}
              onChange={(val) => {
                setCategoryId(val);
                setPage(1);
              }}
              options={categories.map((cat) => ({
                label: cat.name,
                value: cat.id,
              }))}
              includeAllOption
              allLabel="All Categories"
            />
          </div>

          {/* Tracking Type Dropdown */}
          <div className="w-full sm:w-44">
            <FilterSelect
              placeholder="Tracking Type"
              value={trackingType}
              onChange={(val) => {
                setTrackingType(val as any);
                setPage(1);
              }}
              options={[
                { label: "Serialized Assets", value: "SERIALIZED" },
                { label: "Bulk Consumables", value: "BULK" },
              ]}
              includeAllOption
              allLabel="All Tracking"
            />
          </div>

          {/* Issue Policy Dropdown */}
          <div className="w-full sm:w-44">
            <FilterSelect
              placeholder="Issue Policy"
              value={policyFilter}
              onChange={(val) => {
                setPolicyFilter(val as any);
                setPage(1);
              }}
              options={[
                { label: "Permanent Issue", value: "PERMANENT" },
                { label: "Returnable Loan", value: "TEMPORARY" },
                { label: "Gift / Reward", value: "GIFT" },
              ]}
              includeAllOption
              allLabel="All Policies"
            />
          </div>

          {/* Stock Availability Dropdown */}
          <div className="w-full sm:w-40">
            <FilterSelect
              placeholder="Availability"
              value={stockFilter}
              onChange={(val) => {
                setStockFilter(val as any);
                setPage(1);
              }}
              options={[
                { label: "In Stock Only", value: "IN_STOCK" },
                { label: "Low Stock Alert", value: "LOW_STOCK" },
              ]}
              includeAllOption
              allLabel="All Stock"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-border/70 rounded-lg p-0.5 bg-muted/30 self-end lg:self-auto shrink-0">
            <Button
              type="button"
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className="size-8 rounded-md"
              title="Catalog Grid Cards"
            >
              <LayoutGrid className="size-4" />
            </Button>
            <Button
              type="button"
              variant={viewMode === "table" ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode("table")}
              className="size-8 rounded-md"
              title="Compact Admin Table"
            >
              <List className="size-4" />
            </Button>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-10 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5 shrink-0"
            >
              <RotateCcw className="size-3.5" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === "grid" ? (
        <div>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-80 rounded-xl border border-border/60 bg-card animate-pulse"
                />
              ))}
            </div>
          ) : displayedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border/80 bg-card/60">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
                <PackageSearch className="size-6" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                No matching inventory items found
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                Try modifying your search keywords, clearing policy filters, or adjusting the selected storage category.
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  className="mt-4 gap-1.5 text-xs"
                >
                  <RotateCcw className="size-3.5" />
                  <span>Clear All Filters</span>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayedItems.map((item) => (
                <CatalogItemCard
                  key={item.id}
                  item={item}
                  stockCount={stockMap[item.id] ?? item.availableStock ?? 0}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Table View */
        <ItemTable
          items={displayedItems}
          isLoading={isLoading}
          onEdit={handleOpenEdit}
          onDelete={handleOpenDelete}
          onViewDetails={handleViewDetails}
          stockMap={stockMap}
        />
      )}

      {/* Pagination */}
      {meta.total > 0 && (
        <Pagination
          currentPage={meta.page}
          totalPages={meta.totalPage}
          totalData={meta.total}
          limit={meta.limit}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      )}

      {/* Dedicated Item Details Modal */}
      <ItemDetailsModal
        itemId={selectedItemDetailsId}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        onEdit={handleOpenEdit}
      />

      {/* Create / Edit Item Modal */}
      <ItemModal
        open={itemModalOpen}
        onOpenChange={setItemModalOpen}
        item={selectedItemForEdit}
      />

      {/* Requisition Cart Drawer */}
      <RequisitionCartDrawer onProceedToCheckout={() => setCheckoutOpen(true)} />

      {/* Requisition Checkout / Order Submission Dialog */}
      <RequisitionCheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        onBackToCart={() => {
          setCheckoutOpen(false);
          setIsCartOpen(true);
        }}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]">
          <DialogHeader className="p-5 pb-3 border-b bg-card shrink-0">
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Package className="size-5" />
              Confirm Item Deletion
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-5 text-xs text-muted-foreground">
            Are you sure you want to delete{" "}
            <strong className="text-foreground">
              "{itemToDelete?.name}"
            </strong>
            ? If physical units, active stock balances, or submitted requisitions exist, deletion will be safely rejected by database integrity constraints.
          </div>

          <DialogFooter className="p-4 border-t bg-card shrink-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Yes, Delete Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function InventoryPage() {
  return (
    <RequisitionCartProvider>
      <InventoryPageContent />
    </RequisitionCartProvider>
  );
}
