"use client";

import { useState } from "react";
import { Plus, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionHeader from "@/components/shared/SectionHeader";
import SearchInput from "@/components/shared/SearchInput";
import Pagination from "@/components/shared/Pagination";
import CategoryTable from "@/components/categories/CategoryTable";
import CategoryModal from "@/components/categories/CategoryModal";
import {
  useGetCategoriesQuery,
  useDeleteCategoryMutation,
} from "@/redux/api/categoryApi";
import { usePermission } from "@/hooks/usePermission";
import { useDebounce } from "@/hooks/useDebounce";
import { TCategory } from "@/type";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function CategoriesPage() {
  const { can } = usePermission();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<TCategory | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [catToDelete, setCatToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const { data, isLoading } = useGetCategoriesQuery({
    searchTerm: debouncedSearch || undefined,
    page,
    limit,
  });

  const [deleteCategory, { isLoading: isDeleting }] =
    useDeleteCategoryMutation();

  const categories = data?.data || [];
  const meta = data?.meta || {
    page: 1,
    limit: 10,
    total: 0,
    totalPage: 1,
  };

  const handleOpenCreate = () => {
    setSelectedCategory(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (cat: TCategory) => {
    setSelectedCategory(cat);
    setModalOpen(true);
  };

  const handleOpenDelete = (id: string, name: string) => {
    setCatToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!catToDelete) return;
    try {
      await deleteCategory(catToDelete.id).unwrap();
      toast.success(`Category "${catToDelete.name}" deleted successfully.`);
      setDeleteDialogOpen(false);
      setCatToDelete(null);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete category");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <SectionHeader
          title="Category Directory"
          description="Group items and assets into hierarchical categories and subcategories for accurate classification."
        />

        {can("category.create") && (
          <Button onClick={handleOpenCreate} className="shrink-0 gap-1.5 shadow-xs">
            <Plus className="size-4" />
            <span>Add Category</span>
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="w-full sm:max-w-sm">
          <SearchInput
            value={searchTerm}
            onChange={(val) => {
              setSearchTerm(val);
              setPage(1);
            }}
            placeholder="Search categories by name or code..."
          />
        </div>
      </div>

      {/* Category Table */}
      <CategoryTable
        categories={categories}
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
      <CategoryModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        category={selectedCategory}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]">
          <DialogHeader className="p-5 pb-3 border-b bg-card shrink-0">
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Layers className="size-5" />
              Confirm Category Deletion
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-5 text-xs text-muted-foreground">
            Are you sure you want to delete{" "}
            <strong className="text-foreground">
              "{catToDelete?.name}"
            </strong>
            ? Any items assigned to this category must be reassigned.
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
              {isDeleting ? "Deleting..." : "Yes, Delete Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
