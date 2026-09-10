"use client";

import React, { useState, useMemo } from "react";
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  Package,
  Search,
  Loader2,
  ChevronRight,
  Folder,
  FolderOpen,
  Layers,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PermissionGate } from "@/components/shared/permissions/PermissionGate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useGetAllCategoriesQuery,
  useGetCategoryTreeQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from "@/redux/api/categoriesApi";
import { ICategory } from "@/types";
import { toast } from "sonner";

export default function CategoriesPage() {
  const { data: allRes, isLoading, refetch } = useGetAllCategoriesQuery();
  const { data: treeRes, refetch: refetchTree } = useGetCategoryTreeQuery();

  const categories = useMemo(() => allRes?.data || [], [allRes]);
  const categoryTree = useMemo(() => treeRes?.data || [], [treeRes]);

  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation();

  const [viewMode, setViewMode] = useState<"tree" | "table">("tree");
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<ICategory | null>(null);
  const [deletingCat, setDeletingCat] = useState<ICategory | null>(null);

  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    parentId: "NONE",
  });

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleOpenCreate = (parentId?: string) => {
    setForm({
      name: "",
      code: "",
      description: "",
      parentId: parentId || "NONE",
    });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (cat: ICategory) => {
    setEditingCat(cat);
    setForm({
      name: cat.name,
      code: cat.code,
      description: cat.description || "",
      parentId: cat.parentId || "NONE",
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) {
      toast.error("Category name and unique code are required.");
      return;
    }

    try {
      await createCategory({
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        description: form.description.trim() || undefined,
        parentId: form.parentId !== "NONE" ? form.parentId : undefined,
      }).unwrap();
      toast.success("Category created successfully.");
      setIsCreateOpen(false);
      refetch();
      refetchTree();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create category.");
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat) return;
    if (!form.name.trim()) {
      toast.error("Category name is required.");
      return;
    }

    try {
      await updateCategory({
        id: editingCat.id,
        body: {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          parentId: form.parentId !== "NONE" ? form.parentId : null,
        },
      }).unwrap();
      toast.success("Category updated successfully.");
      setEditingCat(null);
      refetch();
      refetchTree();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update category.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCat) return;
    const childCount = deletingCat._count?.children || 0;
    const itemCount = deletingCat._count?.items || 0;

    if (childCount > 0 || itemCount > 0) {
      toast.error(
        `Cannot delete category because it contains ${childCount} sub-category(s) and ${itemCount} inventory item(s). Reassign them first.`
      );
      setDeletingCat(null);
      return;
    }

    try {
      await deleteCategory(deletingCat.id).unwrap();
      toast.success("Category deleted successfully.");
      setDeletingCat(null);
      refetch();
      refetchTree();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete category.");
    }
  };

  const rootCategories = useMemo(
    () => categories.filter((c) => !c.parentId),
    [categories]
  );
  const totalSubcategories = categories.length - rootCategories.length;
  const totalItems = useMemo(
    () => categories.reduce((sum, c) => sum + (c._count?.items || 0), 0),
    [categories]
  );

  const filteredCategories = useMemo(() => {
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
    );
  }, [categories, search]);

  const columns: Column<ICategory>[] = [
    {
      key: "code",
      header: "Code",
      render: (item) => (
        <code className="text-xs font-mono font-bold bg-muted px-2 py-0.5 rounded border text-foreground">
          {item.code}
        </code>
      ),
    },
    {
      key: "name",
      header: "Category Name",
      render: (item) => (
        <div>
          <div className="font-semibold text-foreground flex items-center gap-1.5">
            <span>{item.name}</span>
            {item.parentId && (
              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                Subcategory
              </Badge>
            )}
          </div>
          {item.description && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {item.description}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "parent",
      header: "Parent Category",
      render: (item) => (
        <span className="text-xs text-muted-foreground">
          {item.parent?.name || "Root (Top Level)"}
        </span>
      ),
    },
    {
      key: "items",
      header: "Catalog Items",
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Package className="w-3.5 h-3.5 text-primary" />
          <span className="font-semibold text-foreground">{item._count?.items || 0}</span>
          <span>Items</span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (item) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs gap-1"
            onClick={() => handleOpenCreate(item.id)}
            title="Add Subcategory"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Sub</span>
          </Button>
          <PermissionGate permissions={["category.update"]}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Edit Category"
              onClick={() => handleOpenEdit(item)}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
          </PermissionGate>
          <PermissionGate permissions={["category.delete"]}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:bg-destructive/10"
              title="Delete Category"
              onClick={() => setDeletingCat(item)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </PermissionGate>
        </div>
      ),
    },
  ];

  // Recursive Tree Node Renderer
  const renderTreeNode = (node: any, level = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedIds.has(node.id);

    return (
      <div key={node.id} className="space-y-1">
        <div
          className={`flex items-center justify-between p-2.5 rounded-lg transition-colors border ${
            level === 0 ? "bg-muted/30 font-medium" : "bg-card ml-6 text-sm"
          } hover:bg-muted/50`}
        >
          <div className="flex items-center gap-2">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleExpand(node.id)}
                className="p-1 hover:bg-muted rounded text-muted-foreground transition-transform"
              >
                <ChevronRight
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isExpanded ? "rotate-90 text-primary" : ""
                  }`}
                />
              </button>
            ) : (
              <div className="w-6" />
            )}

            {hasChildren && isExpanded ? (
              <FolderOpen className="w-4 h-4 text-primary" />
            ) : (
              <Folder className="w-4 h-4 text-muted-foreground" />
            )}

            <code className="text-xs font-mono font-bold bg-muted px-2 py-0.5 rounded border">
              {node.code}
            </code>
            <span className="font-semibold text-foreground">{node.name}</span>

            {node.description && (
              <span className="text-xs text-muted-foreground hidden md:inline truncate max-w-xs">
                — {node.description}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs gap-1 hidden sm:flex">
              <Package className="w-3 h-3 text-muted-foreground" />
              <span>{node._count?.items || 0} items</span>
            </Badge>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 px-2"
                onClick={() => handleOpenCreate(node.id)}
              >
                <Plus className="w-3 h-3" />
                <span className="hidden sm:inline">Add Sub</span>
              </Button>

              <PermissionGate permissions={["category.update"]}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => handleOpenEdit(node)}
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
              </PermissionGate>

              <PermissionGate permissions={["category.delete"]}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:bg-destructive/10"
                  onClick={() => setDeletingCat(node)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </PermissionGate>
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="border-l-2 border-border/40 pl-2 space-y-1">
            {node.children.map((child: any) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Inventory Categories"
        description="Multi-tier taxonomy for cataloging science laboratory equipment, computer hardware, chemical reagents, and department stationery."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Inventory", href: "/inventory" },
          { label: "Categories" },
        ]}
      >
        <PermissionGate permissions={["category.create"]}>
          <Button onClick={() => handleOpenCreate()} className="gap-2">
            <Plus className="w-4 h-4" /> Add Root Category
          </Button>
        </PermissionGate>
      </PageHeader>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Categories
            </CardTitle>
            <FolderTree className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active taxonomy groups
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Root Domains
            </CardTitle>
            <Layers className="w-4 h-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rootCategories.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Top-level classification branches
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Subcategories
            </CardTitle>
            <Folder className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubcategories}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Child categories nested in tree
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Categorized Items
            </CardTitle>
            <Package className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Catalog inventory items assigned
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <Card className="border shadow-sm">
        <div className="p-4 border-b flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search categories by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border">
              <Button
                variant={viewMode === "tree" ? "default" : "ghost"}
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => setViewMode("tree")}
              >
                <FolderTree className="w-3.5 h-3.5" />
                <span>Tree Hierarchy</span>
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => setViewMode("table")}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>List View</span>
              </Button>
            </div>
          </div>
        </div>

        {/* View Mode 1: Interactive Hierarchy Tree */}
        {viewMode === "tree" ? (
          <div className="p-6">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 rounded-lg bg-muted/40 animate-pulse" />
                ))}
              </div>
            ) : categoryTree.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FolderTree className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <h3 className="font-semibold text-lg text-foreground">No Categories Found</h3>
                <p className="text-sm mt-1">
                  Start building your taxonomy by adding your first root category above.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground font-semibold px-2">
                  <span>CATEGORY HIERARCHY TREE</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px] text-primary"
                    onClick={() => {
                      if (expandedIds.size > 0) {
                        setExpandedIds(new Set());
                      } else {
                        const allIds = new Set<string>();
                        categories.forEach((c) => allIds.add(c.id));
                        setExpandedIds(allIds);
                      }
                    }}
                  >
                    {expandedIds.size > 0 ? "Collapse All" : "Expand All"}
                  </Button>
                </div>
                {categoryTree.map((root) => renderTreeNode(root, 0))}
              </div>
            )}
          </div>
        ) : (
          /* View Mode 2: Searchable Data Table */
          <DataTable
            columns={columns}
            data={filteredCategories}
            isLoading={isLoading}
            emptyTitle="No categories found"
            emptyDescription="No categories match your search criteria. Add your first category using the button above."
          />
        )}
      </Card>

      {/* Create Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader>
              <DialogTitle>Add Inventory Category</DialogTitle>
              <DialogDescription>
                Define a taxonomic category or subcategory for catalog items.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Parent Category</Label>
                <Select
                  value={form.parentId}
                  onValueChange={(val) => setForm({ ...form, parentId: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="None - Root Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">None (Top-Level Root)</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cat-code" className="text-xs font-semibold">
                    Category Code <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="cat-code"
                    placeholder="e.g. LAB-EQ, COMP, CHEM"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="uppercase font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cat-name" className="text-xs font-semibold">
                    Category Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="cat-name"
                    placeholder="e.g. Computing Hardware"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cat-desc" className="text-xs font-semibold">
                  Description
                </Label>
                <Textarea
                  id="cat-desc"
                  placeholder="Notes on equipment types covered by this category..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...
                  </>
                ) : (
                  "Create Category"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editingCat} onOpenChange={(open) => !open && setEditingCat(null)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleUpdateSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>
                Update details for {editingCat?.code}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Parent Category</Label>
                <Select
                  value={form.parentId}
                  onValueChange={(val) => setForm({ ...form, parentId: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="None - Root Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">None (Top-Level Root)</SelectItem>
                    {categories
                      .filter((c) => c.id !== editingCat?.id)
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} ({c.code})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Category Code</Label>
                  <Input value={editingCat?.code || ""} disabled className="bg-muted font-mono" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-cat-name" className="text-xs font-semibold">
                    Category Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-cat-name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-cat-desc" className="text-xs font-semibold">
                  Description
                </Label>
                <Textarea
                  id="edit-cat-desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingCat(null)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingCat}
        onClose={() => setDeletingCat(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Category"
        description={
          (deletingCat?._count?.children || 0) > 0 || (deletingCat?._count?.items || 0) > 0 ? (
            <span className="text-destructive font-medium flex items-center gap-1.5">
              <FolderTree className="w-4 h-4" />
              This category has {deletingCat?._count?.children || 0} sub-categories and {deletingCat?._count?.items || 0} items attached and cannot be deleted.
            </span>
          ) : (
            `Are you sure you want to delete "${deletingCat?.name}" (${deletingCat?.code})? This action cannot be undone.`
          )
        }
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        variant="destructive"
      />
    </div>
  );
}
