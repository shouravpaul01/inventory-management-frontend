"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Search,
  Loader2,
  ExternalLink,
  ImageIcon,
  QrCode,
  Boxes,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PermissionGate } from "@/components/shared/permissions/PermissionGate";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  useGetAllInventoryItemsQuery,
  useCreateInventoryItemMutation,
  useUpdateInventoryItemMutation,
  useDeleteInventoryItemMutation,
} from "@/redux/api/inventoryApi";
import { useGetAllCategoriesQuery } from "@/redux/api/categoriesApi";
import { IInventoryItem, StockTrackingType, IssuePolicy } from "@/types";
import { toast } from "sonner";

export default function InventoryCatalogPage() {
  const { data: itemsRes, isLoading, refetch } = useGetAllInventoryItemsQuery();
  const { data: catsRes } = useGetAllCategoriesQuery();

  const items = useMemo(() => itemsRes?.data || [], [itemsRes]);
  const categories = useMemo(() => catsRes?.data || [], [catsRes]);

  const [createItem, { isLoading: isCreating }] = useCreateInventoryItemMutation();
  const [updateItem, { isLoading: isUpdating }] = useUpdateInventoryItemMutation();
  const [deleteItem, { isLoading: isDeleting }] = useDeleteInventoryItemMutation();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedTracking, setSelectedTracking] = useState<string>("ALL");
  const [selectedPolicy, setSelectedPolicy] = useState<string>("ALL");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IInventoryItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<IInventoryItem | null>(null);

  const [form, setForm] = useState({
    name: "",
    code: "",
    sku: "",
    description: "",
    categoryId: "",
    brand: "",
    model: "",
    trackingType: "SERIALIZED" as StockTrackingType,
    isReturnable: true,
    defaultIssuePolicy: "TEMPORARY" as IssuePolicy,
    unitName: "Piece",
    minimumStock: 5,
    reorderLevel: 10,
    isActive: true,
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.code.toLowerCase().includes(search.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase().includes(search.toLowerCase())) ||
        (item.brand && item.brand.toLowerCase().includes(search.toLowerCase())) ||
        (item.model && item.model.toLowerCase().includes(search.toLowerCase()));

      const matchesCat = selectedCategory === "ALL" || item.categoryId === selectedCategory;
      const matchesTracking = selectedTracking === "ALL" || item.trackingType === selectedTracking;
      const matchesPolicy = selectedPolicy === "ALL" || item.defaultIssuePolicy === selectedPolicy;

      return matchesSearch && matchesCat && matchesTracking && matchesPolicy;
    });
  }, [items, search, selectedCategory, selectedTracking, selectedPolicy]);

  const serializedCount = useMemo(
    () => items.filter((i) => i.trackingType === "SERIALIZED").length,
    [items]
  );
  const bulkCount = useMemo(
    () => items.filter((i) => i.trackingType === "BULK").length,
    [items]
  );

  const handleOpenCreate = () => {
    setForm({
      name: "",
      code: "",
      sku: "",
      description: "",
      categoryId: categories[0]?.id || "",
      brand: "",
      model: "",
      trackingType: "SERIALIZED",
      isReturnable: true,
      defaultIssuePolicy: "TEMPORARY",
      unitName: "Piece",
      minimumStock: 5,
      reorderLevel: 10,
      isActive: true,
    });
    setSelectedImage(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (item: IInventoryItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      code: item.code,
      sku: item.sku || "",
      description: item.description || "",
      categoryId: item.categoryId,
      brand: item.brand || "",
      model: item.model || "",
      trackingType: item.trackingType,
      isReturnable: item.isReturnable,
      defaultIssuePolicy: item.defaultIssuePolicy,
      unitName: item.unitName || "Piece",
      minimumStock: item.minimumStock || 0,
      reorderLevel: item.reorderLevel || 0,
      isActive: item.isActive,
    });
    setSelectedImage(null);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.categoryId) {
      toast.error("Item name and category are required.");
      return;
    }

    try {
      const payloadData = {
        name: form.name.trim(),
        code: form.code.trim() ? form.code.trim().toUpperCase() : undefined,
        sku: form.sku.trim() ? form.sku.trim().toUpperCase() : undefined,
        description: form.description.trim() || undefined,
        categoryId: form.categoryId,
        brand: form.brand.trim() || undefined,
        model: form.model.trim() || undefined,
        trackingType: form.trackingType,
        isReturnable: form.isReturnable,
        defaultIssuePolicy: form.defaultIssuePolicy,
        unitName: form.unitName.trim() || "Piece",
        minimumStock: Number(form.minimumStock) || 0,
        reorderLevel: Number(form.reorderLevel) || 0,
        isActive: form.isActive,
      };

      let body: FormData | Record<string, any>;
      if (selectedImage) {
        body = new FormData();
        body.append("data", JSON.stringify(payloadData));
        body.append("image", selectedImage);
      } else {
        body = payloadData;
      }

      await createItem(body).unwrap();
      toast.success("Inventory item created successfully.");
      setIsCreateOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create inventory item.");
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    if (!form.name.trim()) {
      toast.error("Item name is required.");
      return;
    }

    try {
      const payloadData = {
        name: form.name.trim(),
        sku: form.sku.trim() ? form.sku.trim().toUpperCase() : undefined,
        description: form.description.trim() || undefined,
        categoryId: form.categoryId || undefined,
        brand: form.brand.trim() || undefined,
        model: form.model.trim() || undefined,
        trackingType: form.trackingType,
        isReturnable: form.isReturnable,
        defaultIssuePolicy: form.defaultIssuePolicy,
        unitName: form.unitName.trim() || "Piece",
        minimumStock: Number(form.minimumStock) || 0,
        reorderLevel: Number(form.reorderLevel) || 0,
        isActive: form.isActive,
      };

      let body: FormData | Record<string, any>;
      if (selectedImage) {
        body = new FormData();
        body.append("data", JSON.stringify(payloadData));
        body.append("image", selectedImage);
      } else {
        body = payloadData;
      }

      await updateItem({ id: editingItem.id, body }).unwrap();
      toast.success("Inventory item updated successfully.");
      setEditingItem(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update item.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    const units = deletingItem._count?.units || 0;
    const balances = deletingItem._count?.stockBalances || 0;

    if (units > 0 || balances > 0) {
      toast.error(
        `Cannot delete item because ${units} serialized unit(s) and ${balances} stock location balance(s) exist.`
      );
      setDeletingItem(null);
      return;
    }

    try {
      await deleteItem(deletingItem.id).unwrap();
      toast.success("Item deleted successfully.");
      setDeletingItem(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete item.");
    }
  };

  const columns: Column<IInventoryItem>[] = [
    {
      key: "photo",
      header: "Photo",
      render: (item) => (
        <div className="relative w-10 h-10 rounded-md bg-muted flex items-center justify-center overflow-hidden border shrink-0">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <ImageIcon className="w-5 h-5 text-muted-foreground/50" />
          )}
        </div>
      ),
    },
    {
      key: "name",
      header: "Item & Codes",
      render: (item) => (
        <div>
          <div className="flex items-center gap-2">
            <code className="text-xs font-mono font-bold bg-muted px-2 py-0.5 rounded border text-foreground">
              {item.code}
            </code>
            {item.sku && (
              <span className="text-xs font-mono text-muted-foreground">
                SKU: {item.sku}
              </span>
            )}
          </div>
          <Link
            href={`/inventory/${item.id}`}
            className="font-semibold text-foreground hover:text-primary transition-colors text-sm mt-0.5 block"
          >
            {item.name}
          </Link>
          {(item.brand || item.model) && (
            <div className="text-[11px] text-muted-foreground">
              {[item.brand, item.model].filter(Boolean).join(" • ")}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (item) => (
        <Badge variant="outline" className="text-xs">
          {item.category?.name || "General"}
        </Badge>
      ),
    },
    {
      key: "tracking",
      header: "Tracking Type",
      render: (item) => (
        <Badge
          variant="outline"
          className={`text-xs font-semibold ${
            item.trackingType === "SERIALIZED"
              ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300"
              : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300"
          }`}
        >
          {item.trackingType === "SERIALIZED" ? (
            <span className="flex items-center gap-1">
              <QrCode className="w-3 h-3" /> Serialized
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Boxes className="w-3 h-3" /> Bulk SKU
            </span>
          )}
        </Badge>
      ),
    },
    {
      key: "issuePolicy",
      header: "Issue Policy",
      render: (item) => (
        <div className="text-xs space-y-0.5">
          <Badge variant="secondary" className="text-[10px] font-semibold">
            {item.defaultIssuePolicy}
          </Badge>
          {item.isReturnable && (
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
              <RotateCcw className="w-3 h-3" /> Returnable
            </div>
          )}
        </div>
      ),
    },
    {
      key: "stock",
      header: "Stock Metrics",
      render: (item) => {
        const total = item.unitStats?.total ?? item._count?.units ?? 0;
        const isLow = total <= (item.minimumStock || 0);

        return (
          <div className="text-xs space-y-0.5 font-mono">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <span>{total} {item.unitName || "pcs"}</span>
              {isLow && total > 0 && (
                <span className="text-amber-600 text-[10px] flex items-center gap-0.5 font-sans font-normal">
                  <AlertTriangle className="w-3 h-3" /> Low
                </span>
              )}
            </div>
            <div className="text-[11px] text-muted-foreground font-sans">
              Min: {item.minimumStock || 0} • Reorder: {item.reorderLevel || 0}
            </div>
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (item) => (
        <div className="flex items-center gap-1">
          <Button asChild variant="ghost" size="sm" className="h-8 text-xs gap-1">
            <Link href={`/inventory/${item.id}`}>
              <span>View</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </Button>
          <PermissionGate permissions={["inventory.update"]}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Edit Item"
              onClick={() => handleOpenEdit(item)}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
          </PermissionGate>
          <PermissionGate permissions={["inventory.delete"]}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:bg-destructive/10"
              title="Delete Item"
              onClick={() => setDeletingItem(item)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </PermissionGate>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Inventory Catalog"
        description="Unified registry of physical department assets, serialized science laboratory equipment, and consumable bulk supplies."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Inventory" },
          { label: "Catalog" },
        ]}
      >
        <PermissionGate permissions={["inventory.create"]}>
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="w-4 h-4" /> Add Inventory Item
          </Button>
        </PermissionGate>
      </PageHeader>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Catalog SKUs
            </CardTitle>
            <Package className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Registered equipment and consumable models
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Serialized Items
            </CardTitle>
            <QrCode className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serializedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Items tracked by QR / Asset Tag
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Bulk Stock Items
            </CardTitle>
            <Boxes className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bulkCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Items tracked by shelf quantity
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Search Matches
            </CardTitle>
            <Search className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredItems.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Items matching current filters
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Table */}
      <Card className="border shadow-sm">
        <div className="p-4 border-b space-y-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search items by name, SKU, brand, model..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter */}
              <div className="w-44">
                <Select
                  value={selectedCategory}
                  onValueChange={(val) => setSelectedCategory(val)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Categories</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tracking Type Filter */}
              <div className="w-36">
                <Select
                  value={selectedTracking}
                  onValueChange={(val) => setSelectedTracking(val)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Tracking" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Tracking</SelectItem>
                    <SelectItem value="SERIALIZED">SERIALIZED</SelectItem>
                    <SelectItem value="BULK">BULK</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Issue Policy Filter */}
              <div className="w-36">
                <Select
                  value={selectedPolicy}
                  onValueChange={(val) => setSelectedPolicy(val)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Issue Policy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Policies</SelectItem>
                    <SelectItem value="TEMPORARY">TEMPORARY</SelectItem>
                    <SelectItem value="PERMANENT">PERMANENT</SelectItem>
                    <SelectItem value="GIFT">GIFT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredItems}
          isLoading={isLoading}
          emptyTitle="No inventory items found"
          emptyDescription="No items match your selected filters. Add your first item using the button above."
        />
      </Card>

      {/* Create Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-2xl">
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader>
              <DialogTitle>Add Inventory Item</DialogTitle>
              <DialogDescription>
                Register a new equipment model or material in the university catalog.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="item-name" className="text-xs font-semibold">
                    Item Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="item-name"
                    placeholder="e.g. Dell Precision Workstation"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.categoryId}
                    onValueChange={(val) => setForm({ ...form, categoryId: val })}
                    required
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} ({c.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="item-code" className="text-xs font-semibold">
                    Item Code (Optional)
                  </Label>
                  <Input
                    id="item-code"
                    placeholder="e.g. IT-WS-01 (or auto-generated)"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="uppercase font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="item-sku" className="text-xs font-semibold">
                    Manufacturer SKU / Barcode
                  </Label>
                  <Input
                    id="item-sku"
                    placeholder="e.g. DELL-WS-3660"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="uppercase font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="item-brand" className="text-xs font-semibold">
                    Brand / Manufacturer
                  </Label>
                  <Input
                    id="item-brand"
                    placeholder="e.g. Dell, Tektronix, Cisco"
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="item-model" className="text-xs font-semibold">
                    Model Number
                  </Label>
                  <Input
                    id="item-model"
                    placeholder="e.g. Precision 3660 Tower"
                    value={form.model}
                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                  />
                </div>
              </div>

              {/* Tracking & Issue Policy */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Stock Tracking Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.trackingType}
                    onValueChange={(val: StockTrackingType) =>
                      setForm({ ...form, trackingType: val })
                    }
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Select tracking" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SERIALIZED">
                        SERIALIZED (Unique Asset Tags & QR Codes)
                      </SelectItem>
                      <SelectItem value="BULK">
                        BULK (Quantity Only / Consumables)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Default Issue Policy <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.defaultIssuePolicy}
                    onValueChange={(val: IssuePolicy) =>
                      setForm({ ...form, defaultIssuePolicy: val })
                    }
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Select policy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TEMPORARY">TEMPORARY (Loans / Returns Expected)</SelectItem>
                      <SelectItem value="PERMANENT">PERMANENT (Permanent Staff Assignment)</SelectItem>
                      <SelectItem value="GIFT">GIFT (Transfer of Ownership)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Quantity metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="unit-name" className="text-xs font-semibold">
                    Unit of Measure
                  </Label>
                  <Input
                    id="unit-name"
                    placeholder="Piece, Box, Meter"
                    value={form.unitName}
                    onChange={(e) => setForm({ ...form, unitName: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="min-stock" className="text-xs font-semibold">
                    Minimum Stock
                  </Label>
                  <Input
                    id="min-stock"
                    type="number"
                    min={0}
                    value={form.minimumStock}
                    onChange={(e) => setForm({ ...form, minimumStock: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reorder-level" className="text-xs font-semibold">
                    Reorder Threshold
                  </Label>
                  <Input
                    id="reorder-level"
                    type="number"
                    min={0}
                    value={form.reorderLevel}
                    onChange={(e) => setForm({ ...form, reorderLevel: Number(e.target.value) })}
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="text-xs font-semibold">Item Returnable</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Enable if custodians must return this asset when no longer in use
                  </p>
                </div>
                <Switch
                  checked={form.isReturnable}
                  onCheckedChange={(val) => setForm({ ...form, isReturnable: val })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="item-desc" className="text-xs font-semibold">
                  Specification & Notes
                </Label>
                <Textarea
                  id="item-desc"
                  placeholder="Hardware specifications, warranty info, or storage precautions..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                />
              </div>

              {/* Photo Upload */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Product Photo (Optional)</Label>
                <ImageUploader
                  value={null}
                  onChange={(file) => setSelectedImage(file)}
                  label="Upload Item Image"
                  description="High resolution photo of equipment (PNG, JPG up to 5MB)"
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
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating...
                  </>
                ) : (
                  "Create Catalog Item"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="sm:max-w-2xl">
          <form onSubmit={handleUpdateSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Inventory Item</DialogTitle>
              <DialogDescription>
                Update catalog details for {editingItem?.code}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-name" className="text-xs font-semibold">
                    Item Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Category</Label>
                  <Select
                    value={form.categoryId}
                    onValueChange={(val) => setForm({ ...form, categoryId: val })}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} ({c.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Item Code</Label>
                  <Input value={editingItem?.code || ""} disabled className="bg-muted font-mono" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-sku" className="text-xs font-semibold">
                    Manufacturer SKU
                  </Label>
                  <Input
                    id="edit-sku"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="uppercase font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-brand" className="text-xs font-semibold">
                    Brand / Manufacturer
                  </Label>
                  <Input
                    id="edit-brand"
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-model" className="text-xs font-semibold">
                    Model Number
                  </Label>
                  <Input
                    id="edit-model"
                    value={form.model}
                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-unit-name" className="text-xs font-semibold">
                    Unit of Measure
                  </Label>
                  <Input
                    id="edit-unit-name"
                    value={form.unitName}
                    onChange={(e) => setForm({ ...form, unitName: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-min-stock" className="text-xs font-semibold">
                    Minimum Stock
                  </Label>
                  <Input
                    id="edit-min-stock"
                    type="number"
                    min={0}
                    value={form.minimumStock}
                    onChange={(e) => setForm({ ...form, minimumStock: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-reorder-level" className="text-xs font-semibold">
                    Reorder Threshold
                  </Label>
                  <Input
                    id="edit-reorder-level"
                    type="number"
                    min={0}
                    value={form.reorderLevel}
                    onChange={(e) => setForm({ ...form, reorderLevel: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="text-xs font-semibold">Item Returnable</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Required return when no longer needed
                  </p>
                </div>
                <Switch
                  checked={form.isReturnable}
                  onCheckedChange={(val) => setForm({ ...form, isReturnable: val })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-desc" className="text-xs font-semibold">
                  Specification & Notes
                </Label>
                <Textarea
                  id="edit-desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Update Product Photo (Optional)</Label>
                <ImageUploader
                  value={editingItem?.imageUrl}
                  onChange={(file) => setSelectedImage(file)}
                  label="Replace Item Image"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingItem(null)}
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
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Inventory Item"
        description={
          (deletingItem?._count?.units || 0) > 0 || (deletingItem?._count?.stockBalances || 0) > 0 ? (
            <span className="text-destructive font-medium flex items-center gap-1.5">
              <Package className="w-4 h-4" />
              This item has active serialized units or storage balances recorded in the system and cannot be deleted.
            </span>
          ) : (
            `Are you sure you want to delete "${deletingItem?.name}" (${deletingItem?.code})? This action cannot be undone.`
          )
        }
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        variant="destructive"
      />
    </div>
  );
}
