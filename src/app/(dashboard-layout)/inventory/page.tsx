"use client";

import { useState } from "react";
import { Plus, Package, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionHeader from "@/components/shared/SectionHeader";
import SearchInput from "@/components/shared/SearchInput";
import FilterSelect from "@/components/shared/FilterSelect";
import Pagination from "@/components/shared/Pagination";
import ItemTable from "@/components/inventory/ItemTable";
import ItemModal from "@/components/inventory/ItemModal";
import {
  useGetItemsQuery,
  useDeleteItemMutation,
} from "@/redux/api/itemApi";
import { useGetCategoriesQuery } from "@/redux/api/categoryApi";
import { usePermission } from "@/hooks/usePermission";
import { useDebounce } from "@/hooks/useDebounce";
import { TInventoryItem, TTrackingType } from "@/type";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function InventoryPage() {
  const { can } = usePermission();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);

  const [categoryId, setCategoryId] = useState("");
  const [trackingType, setTrackingType] = useState<TTrackingType | "">("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TInventoryItem | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const { data: categoriesData } = useGetCategoriesQuery({ limit: 100 });
  const categories = categoriesData?.data || [];

  const { data, isLoading } = useGetItemsQuery({
    searchTerm: debouncedSearch || undefined,
    categoryId: categoryId || undefined,
    trackingType: (trackingType as TTrackingType) || undefined,
    page,
    limit,
  });

  const [deleteItem, { isLoading: isDeleting }] = useDeleteItemMutation();

  const items = data?.data || [];
  const meta = data?.meta || {
    page: 1,
    limit: 10,
    total: 0,
    totalPage: 1,
  };

  const handleOpenCreate = () => {
    setSelectedItem(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: TInventoryItem) => {
    setSelectedItem(item);
    setModalOpen(true);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <SectionHeader
          title="Inventory Catalog"
          description="Master registry of campus assets and consumable stock items with reorder threshold tracking."
        />

        {can("inventory.create") && (
          <Button onClick={handleOpenCreate} className="shrink-0 gap-1.5 shadow-xs">
            <Plus className="size-4" />
            <span>Catalog New Item</span>
          </Button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="w-full sm:max-w-xs">
          <SearchInput
            value={searchTerm}
            onChange={(val) => {
              setSearchTerm(val);
              setPage(1);
            }}
            placeholder="Search items by name, code, or brand..."
          />
        </div>

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

        <div className="w-full sm:w-48">
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
            allLabel="All Tracking Types"
          />
        </div>

        {(searchTerm || categoryId || trackingType) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchTerm("");
              setCategoryId("");
              setTrackingType("");
              setPage(1);
            }}
            className="h-11 px-3 text-xs text-muted-foreground hover:text-foreground gap-1.5 shrink-0 self-center sm:self-auto"
          >
            <RotateCcw className="size-3.5" />
            <span>Reset</span>
          </Button>
        )}
      </div>

      {/* Item Table */}
      <ItemTable
        items={items}
        isLoading={isLoading}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
      />

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

      {/* Create / Edit Modal */}
      <ItemModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        item={selectedItem}
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
            ? If units or active transactions exist, deletion will be blocked by system constraints.
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
