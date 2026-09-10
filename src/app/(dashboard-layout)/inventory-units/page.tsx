"use client";

import React, { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  QrCode,
  Plus,
  Edit2,
  Search,
  Loader2,
  Sparkles,
  Warehouse,
  ScanLine,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PermissionGate } from "@/components/shared/permissions/PermissionGate";
import { Card } from "@/components/ui/card";
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
  useGetAllInventoryUnitsQuery,
  useCreateInventoryUnitMutation,
  useBatchCreateUnitsMutation,
  useUpdateInventoryUnitMutation,
} from "@/redux/api/inventoryUnitsApi";
import { useGetAllInventoryItemsQuery } from "@/redux/api/inventoryApi";
import { useGetAllStockLocationsQuery } from "@/redux/api/locationsApi";
import { IInventoryUnit, InventoryUnitStatus, ConditionStatus } from "@/types";
import { toast } from "sonner";

const UNIT_STATUSES: InventoryUnitStatus[] = [
  "IN_STOCK",
  "RESERVED",
  "ISSUED",
  "RETURN_PENDING",
  "RETURNED",
  "DAMAGED",
  "LOST",
  "DISPOSED",
  "GIFTED",
  "MAINTENANCE",
];

const CONDITIONS: ConditionStatus[] = [
  "NEW",
  "GOOD",
  "FAIR",
  "DAMAGED",
  "LOST",
  "DISPOSED",
];

function InventoryUnitsContent() {
  const searchParams = useSearchParams();
  const initialItemId = searchParams.get("itemId") || "ALL";

  const { data: itemsRes } = useGetAllInventoryItemsQuery();
  const { data: locsRes } = useGetAllStockLocationsQuery();

  const allItems = useMemo(() => itemsRes?.data || [], [itemsRes]);
  const serializedItems = useMemo(
    () => allItems.filter((i) => i.trackingType === "SERIALIZED"),
    [allItems]
  );
  const locations = useMemo(() => locsRes?.data || [], [locsRes]);

  const [selectedItemId, setSelectedItemId] = useState<string>(initialItemId);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedCondition, setSelectedCondition] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const queryParams = useMemo(() => {
    const params: Record<string, any> = {};
    if (selectedItemId && selectedItemId !== "ALL") params.inventoryItemId = selectedItemId;
    if (selectedStatus && selectedStatus !== "ALL") params.status = selectedStatus;
    if (selectedCondition && selectedCondition !== "ALL") params.condition = selectedCondition;
    return params;
  }, [selectedItemId, selectedStatus, selectedCondition]);

  const { data: unitsRes, isLoading, refetch } = useGetAllInventoryUnitsQuery(queryParams);
  const units = useMemo(() => unitsRes?.data || [], [unitsRes]);

  const [createUnit, { isLoading: isCreatingSingle }] = useCreateInventoryUnitMutation();
  const [batchCreate, { isLoading: isBatchCreating }] = useBatchCreateUnitsMutation();
  const [updateUnit, { isLoading: isUpdating }] = useUpdateInventoryUnitMutation();

  const [isSingleOpen, setIsSingleOpen] = useState(false);
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<IInventoryUnit | null>(null);

  // Single unit form
  const [singleForm, setSingleForm] = useState({
    inventoryItemId: "",
    serialNumber: "",
    barcode: "",
    uniqueCode: "",
    condition: "NEW" as ConditionStatus,
    locationId: "",
    notes: "",
  });

  // Batch unit form
  const [batchForm, setBatchForm] = useState({
    inventoryItemId: "",
    count: 5,
    locationId: "",
    condition: "NEW" as ConditionStatus,
    notes: "",
  });

  // Edit unit form
  const [editForm, setEditForm] = useState({
    serialNumber: "",
    barcode: "",
    condition: "GOOD" as ConditionStatus,
    locationId: "",
    notes: "",
  });

  const handleOpenSingle = () => {
    const defaultItem = serializedItems.find((i) => i.id === selectedItemId) || serializedItems[0];
    setSingleForm({
      inventoryItemId: defaultItem?.id || "",
      serialNumber: "",
      barcode: "",
      uniqueCode: "",
      condition: "NEW",
      locationId: locations[0]?.id || "",
      notes: "",
    });
    setIsSingleOpen(true);
  };

  const handleOpenBatch = () => {
    const defaultItem = serializedItems.find((i) => i.id === selectedItemId) || serializedItems[0];
    setBatchForm({
      inventoryItemId: defaultItem?.id || "",
      count: 10,
      locationId: locations[0]?.id || "",
      condition: "NEW",
      notes: "",
    });
    setIsBatchOpen(true);
  };

  const handleOpenEdit = (unit: IInventoryUnit) => {
    setEditingUnit(unit);
    setEditForm({
      serialNumber: unit.serialNumber || "",
      barcode: unit.barcode || "",
      condition: unit.condition || "GOOD",
      locationId: unit.currentLocationId || "",
      notes: (unit as any).notes || "",
    });
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleForm.inventoryItemId) {
      toast.error("Please select a serialized inventory item.");
      return;
    }

    try {
      await createUnit({
        inventoryItemId: singleForm.inventoryItemId,
        uniqueCode: singleForm.uniqueCode.trim() ? singleForm.uniqueCode.trim().toUpperCase() : undefined,
        serialNumber: singleForm.serialNumber.trim() || undefined,
        barcode: singleForm.barcode.trim() || undefined,
        condition: singleForm.condition,
        locationId: singleForm.locationId || undefined,
        notes: singleForm.notes.trim() || undefined,
      }).unwrap();
      toast.success("Serialized unit created.");
      setIsSingleOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create unit.");
    }
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchForm.inventoryItemId) {
      toast.error("Please select a serialized inventory item.");
      return;
    }

    if (batchForm.count < 1 || batchForm.count > 100) {
      toast.error("Batch quantity must be between 1 and 100.");
      return;
    }

    try {
      const res = await batchCreate({
        inventoryItemId: batchForm.inventoryItemId,
        count: Number(batchForm.count),
        locationId: batchForm.locationId || undefined,
        condition: batchForm.condition,
        notes: batchForm.notes.trim() || undefined,
      }).unwrap();
      toast.success(`Successfully generated ${res.data?.count || batchForm.count} serialized units.`);
      setIsBatchOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to batch create units.");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUnit) return;

    try {
      await updateUnit({
        id: editingUnit.id,
        body: {
          serialNumber: editForm.serialNumber.trim() || undefined,
          barcode: editForm.barcode.trim() || undefined,
          condition: editForm.condition,
          locationId: editForm.locationId || undefined,
          notes: editForm.notes.trim() || undefined,
        },
      }).unwrap();
      toast.success("Unit details updated.");
      setEditingUnit(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update unit.");
    }
  };

  const filteredUnits = useMemo(() => {
    return units.filter((u) => {
      const code = u.uniqueCode || (u as any).qrCode || "";
      const serial = u.serialNumber || "";
      const itemName = u.inventoryItem?.name || "";

      return (
        code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        serial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        itemName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [units, searchTerm]);

  const columns: Column<IInventoryUnit>[] = [
    {
      key: "uniqueCode",
      header: "Asset / QR Code",
      render: (item) => (
        <div>
          <code className="text-xs font-mono font-bold bg-muted px-2 py-0.5 rounded border text-foreground select-all">
            {item.uniqueCode || (item as any).qrCode || item.id}
          </code>
          {item.barcode && (
            <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
              Bar: {item.barcode}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "item",
      header: "Catalog Model",
      render: (item) => (
        <div>
          <Link
            href={`/inventory/${item.inventoryItemId}`}
            className="font-semibold text-foreground hover:text-primary transition-colors text-sm"
          >
            {item.inventoryItem?.name || "Equipment Model"}
          </Link>
          <div className="text-xs text-muted-foreground">
            {item.inventoryItem?.code}
          </div>
        </div>
      ),
    },
    {
      key: "serialNumber",
      header: "Manufacturer Serial",
      render: (item) => (
        <span className="text-xs font-mono text-muted-foreground">
          {item.serialNumber || "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: "condition",
      header: "Condition",
      render: (item) => (
        <Badge variant="outline" className="text-xs">
          {item.condition || "GOOD"}
        </Badge>
      ),
    },
    {
      key: "location",
      header: "Current Location",
      render: (item) => (
        <div className="text-xs space-y-0.5">
          <div className="flex items-center gap-1 text-foreground font-medium">
            <Warehouse className="w-3.5 h-3.5 text-muted-foreground" />
            <span>{item.currentLocation?.name || "Central Store"}</span>
          </div>
          {item.currentLocation?.code && (
            <code className="text-[10px] text-muted-foreground">
              [{item.currentLocation.code}]
            </code>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (item) => (
        <div className="flex items-center gap-1">
          <Button asChild variant="ghost" size="sm" className="h-8 text-xs gap-1">
            <Link href={`/inventory-units/${item.id}`}>
              <QrCode className="w-3.5 h-3.5" />
              <span>QR Tag</span>
            </Link>
          </Button>
          <PermissionGate permissions={["inventory_unit.update"]}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Edit Unit"
              onClick={() => handleOpenEdit(item)}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
          </PermissionGate>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Serialized Equipment Units"
        description="Individual physical assets with unique barcode and QR identification, condition assessment, and operational lifecycle tracking."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Inventory", href: "/inventory" },
          { label: "Serialized Units" },
        ]}
      >
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href="/inventory-units/lookup">
              <ScanLine className="w-4 h-4 text-primary" />
              <span>QR Scanner & Lookup</span>
            </Link>
          </Button>

          <PermissionGate permissions={["inventory_unit.create"]}>
            <Button variant="secondary" size="sm" onClick={handleOpenBatch} className="gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Batch Generate</span>
            </Button>

            <Button size="sm" onClick={handleOpenSingle} className="gap-1.5">
              <Plus className="w-4 h-4" />
              <span>Add Single Unit</span>
            </Button>
          </PermissionGate>
        </div>
      </PageHeader>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border shadow-sm p-4">
          <span className="text-xs text-muted-foreground font-medium">Total Tracked Units</span>
          <div className="text-2xl font-bold mt-1 text-foreground">{units.length}</div>
          <span className="text-[11px] text-muted-foreground">Serialized physical devices</span>
        </Card>

        <Card className="border shadow-sm p-4">
          <span className="text-xs text-emerald-600 font-medium">In Stock (Available)</span>
          <div className="text-2xl font-bold mt-1 text-emerald-600">
            {units.filter((u) => u.status === "IN_STOCK").length}
          </div>
          <span className="text-[11px] text-muted-foreground">Ready for issue or loan</span>
        </Card>

        <Card className="border shadow-sm p-4">
          <span className="text-xs text-blue-600 font-medium">Currently Issued</span>
          <div className="text-2xl font-bold mt-1 text-blue-600">
            {units.filter((u) => u.status === "ISSUED").length}
          </div>
          <span className="text-[11px] text-muted-foreground">In staff/student custody</span>
        </Card>

        <Card className="border shadow-sm p-4">
          <span className="text-xs text-rose-600 font-medium">Maintenance / Damaged</span>
          <div className="text-2xl font-bold mt-1 text-rose-600">
            {units.filter((u) => u.status === "DAMAGED" || u.status === "MAINTENANCE").length}
          </div>
          <span className="text-[11px] text-muted-foreground">Requires repair or inspection</span>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card className="border shadow-sm">
        <div className="p-4 border-b space-y-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by asset tag, serial, or model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Item filter */}
              <div className="w-48">
                <Select
                  value={selectedItemId}
                  onValueChange={(val) => setSelectedItemId(val)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="All Models" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Equipment Models</SelectItem>
                    {serializedItems.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.name} ({i.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status filter */}
              <div className="w-36">
                <Select
                  value={selectedStatus}
                  onValueChange={(val) => setSelectedStatus(val)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    {UNIT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Condition filter */}
              <div className="w-36">
                <Select
                  value={selectedCondition}
                  onValueChange={(val) => setSelectedCondition(val)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Conditions</SelectItem>
                    {CONDITIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredUnits}
          isLoading={isLoading}
          emptyTitle="No serialized units found"
          emptyDescription="No equipment units match your criteria. Use 'Batch Generate' or 'Add Single Unit' above to create serialized units."
        />
      </Card>

      {/* Batch Create Dialog */}
      <Dialog open={isBatchOpen} onOpenChange={setIsBatchOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleBatchSubmit}>
            <DialogHeader>
              <DialogTitle>Batch Generate Serialized Units</DialogTitle>
              <DialogDescription>
                Automatically create a sequence of tagged units with auto-generated asset codes.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Equipment Model <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={batchForm.inventoryItemId}
                  onValueChange={(val) => setBatchForm({ ...batchForm, inventoryItemId: val })}
                  required
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select serialized item" />
                  </SelectTrigger>
                  <SelectContent>
                    {serializedItems.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.name} ({i.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="batch-count" className="text-xs font-semibold">
                    Quantity to Generate <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="batch-count"
                    type="number"
                    min={1}
                    max={100}
                    value={batchForm.count}
                    onChange={(e) => setBatchForm({ ...batchForm, count: Number(e.target.value) })}
                    required
                  />
                  <span className="text-[10px] text-muted-foreground">Max 100 units per batch</span>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Initial Condition</Label>
                  <Select
                    value={batchForm.condition}
                    onValueChange={(val: ConditionStatus) =>
                      setBatchForm({ ...batchForm, condition: val })
                    }
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDITIONS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Destination Storage Shelf / Rack</Label>
                <Select
                  value={batchForm.locationId}
                  onValueChange={(val) => setBatchForm({ ...batchForm, locationId: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select storage location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name} [{loc.type}] ({loc.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="batch-notes" className="text-xs font-semibold">
                  Batch Batch / PO Reference Notes
                </Label>
                <Textarea
                  id="batch-notes"
                  placeholder="e.g. Received from Supplier PO #4401"
                  value={batchForm.notes}
                  onChange={(e) => setBatchForm({ ...batchForm, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsBatchOpen(false)}
                disabled={isBatchCreating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isBatchCreating}>
                {isBatchCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating...
                  </>
                ) : (
                  `Generate ${batchForm.count} Units`
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Single Unit Dialog */}
      <Dialog open={isSingleOpen} onOpenChange={setIsSingleOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSingleSubmit}>
            <DialogHeader>
              <DialogTitle>Add Single Serialized Unit</DialogTitle>
              <DialogDescription>
                Register a specific device with manual or auto-assigned asset code.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Equipment Model <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={singleForm.inventoryItemId}
                  onValueChange={(val) => setSingleForm({ ...singleForm, inventoryItemId: val })}
                  required
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select item model" />
                  </SelectTrigger>
                  <SelectContent>
                    {serializedItems.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.name} ({i.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="single-serial" className="text-xs font-semibold">
                    Manufacturer Serial Number
                  </Label>
                  <Input
                    id="single-serial"
                    placeholder="e.g. SN-9844012"
                    value={singleForm.serialNumber}
                    onChange={(e) => setSingleForm({ ...singleForm, serialNumber: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="single-barcode" className="text-xs font-semibold">
                    Manufacturer Barcode
                  </Label>
                  <Input
                    id="single-barcode"
                    placeholder="e.g. 74839201948"
                    value={singleForm.barcode}
                    onChange={(e) => setSingleForm({ ...singleForm, barcode: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="single-code" className="text-xs font-semibold">
                  Custom Asset Tag (Leave blank to auto-generate)
                </Label>
                <Input
                  id="single-code"
                  placeholder="Leave blank for system auto-sequence"
                  value={singleForm.uniqueCode}
                  onChange={(e) => setSingleForm({ ...singleForm, uniqueCode: e.target.value })}
                  className="font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Initial Condition</Label>
                  <Select
                    value={singleForm.condition}
                    onValueChange={(val: ConditionStatus) =>
                      setSingleForm({ ...singleForm, condition: val })
                    }
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDITIONS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Initial Location</Label>
                  <Select
                    value={singleForm.locationId}
                    onValueChange={(val) => setSingleForm({ ...singleForm, locationId: val })}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Storage Shelf" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSingleOpen(false)}
                disabled={isCreatingSingle}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreatingSingle}>
                {isCreatingSingle ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating...
                  </>
                ) : (
                  "Create Unit"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Unit Modal */}
      <Dialog open={!!editingUnit} onOpenChange={(open) => !open && setEditingUnit(null)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Serialized Unit</DialogTitle>
              <DialogDescription>
                Update asset serial number, condition, or storage shelf location.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Asset Tag Code</Label>
                <Input
                  value={editingUnit?.uniqueCode || (editingUnit as any)?.qrCode || ""}
                  disabled
                  className="bg-muted font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-serial" className="text-xs font-semibold">
                    Manufacturer Serial
                  </Label>
                  <Input
                    id="edit-serial"
                    value={editForm.serialNumber}
                    onChange={(e) => setEditForm({ ...editForm, serialNumber: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-barcode" className="text-xs font-semibold">
                    Manufacturer Barcode
                  </Label>
                  <Input
                    id="edit-barcode"
                    value={editForm.barcode}
                    onChange={(e) => setEditForm({ ...editForm, barcode: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Physical Condition</Label>
                <Select
                  value={editForm.condition}
                  onValueChange={(val: ConditionStatus) =>
                    setEditForm({ ...editForm, condition: val })
                  }
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Storage Location</Label>
                <Select
                  value={editForm.locationId}
                  onValueChange={(val) => setEditForm({ ...editForm, locationId: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select storage unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name} [{loc.type}] ({loc.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-notes" className="text-xs font-semibold">
                  Inspection Notes
                </Label>
                <Textarea
                  id="edit-notes"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingUnit(null)}
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
    </div>
  );
}

export default function InventoryUnitsPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading serialized units...</div>}>
      <InventoryUnitsContent />
    </Suspense>
  );
}
