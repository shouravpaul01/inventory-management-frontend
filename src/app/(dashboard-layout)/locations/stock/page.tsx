"use client";

import React, { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Warehouse,
  Plus,
  Edit2,
  Trash2,
  Building2,
  DoorClosed,
  Search,
  Loader2,
  AlertCircle,
  ExternalLink,
  ImageIcon,
  Boxes,
  QrCode,
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
  useGetAllStockLocationsQuery,
  useGetAllRoomsQuery,
  useCreateStockLocationMutation,
  useUpdateStockLocationMutation,
  useDeleteStockLocationMutation,
} from "@/redux/api/locationsApi";
import { IStockLocation, LocationType } from "@/types";
import { toast } from "sonner";

const LOCATION_TYPES: LocationType[] = [
  "STORE",
  "ROOM",
  "RACK",
  "SHELF",
  "CABINET",
  "OTHER",
];

function StockLocationsContent() {
  const searchParams = useSearchParams();
  const initialRoomId = searchParams.get("roomId") || "ALL";

  const { data: roomsRes } = useGetAllRoomsQuery();
  const allRooms = useMemo(() => roomsRes?.data || [], [roomsRes]);

  const [selectedRoomId, setSelectedRoomId] = useState<string>(initialRoomId);
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const queryParams = useMemo(() => {
    const params: Record<string, any> = {};
    if (selectedRoomId && selectedRoomId !== "ALL") params.roomId = selectedRoomId;
    if (selectedType && selectedType !== "ALL") params.type = selectedType;
    return params;
  }, [selectedRoomId, selectedType]);

  const { data: locsRes, isLoading, refetch } = useGetAllStockLocationsQuery(queryParams);
  const locations = useMemo(() => locsRes?.data || [], [locsRes]);

  const [createLocation, { isLoading: isCreating }] = useCreateStockLocationMutation();
  const [updateLocation, { isLoading: isUpdating }] = useUpdateStockLocationMutation();
  const [deleteLocation, { isLoading: isDeleting }] = useDeleteStockLocationMutation();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<IStockLocation | null>(null);
  const [deletingLocation, setDeletingLocation] = useState<IStockLocation | null>(null);

  const [form, setForm] = useState({
    buildingId: "",
    floorId: "",
    roomId: "",
    name: "",
    code: "",
    type: "SHELF" as LocationType,
    description: "",
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  // Filter in memory for search
  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      const matchesSearch =
        loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loc.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loc.room?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRoom = selectedRoomId === "ALL" || loc.roomId === selectedRoomId;
      const matchesType = selectedType === "ALL" || loc.type === selectedType;

      return matchesSearch && matchesRoom && matchesType;
    });
  }, [locations, searchTerm, selectedRoomId, selectedType]);

  const totalBalances = useMemo(() => {
    return locations.reduce((sum, l) => sum + (l._count?.stockBalances || 0), 0);
  }, [locations]);

  const totalUnits = useMemo(() => {
    return locations.reduce((sum, l) => sum + (l._count?.inventoryUnits || 0), 0);
  }, [locations]);

  const handleOpenCreate = () => {
    const defaultRoom = allRooms.find((r) => r.id === selectedRoomId) || allRooms[0];
    setForm({
      buildingId: defaultRoom?.buildingId || defaultRoom?.floor?.buildingId || "",
      floorId: defaultRoom?.floorId || "",
      roomId: defaultRoom?.id || "",
      name: "",
      code: "",
      type: "SHELF",
      description: "",
    });
    setSelectedImage(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (loc: IStockLocation) => {
    setEditingLocation(loc);
    setForm({
      buildingId: (loc as any).buildingId || loc.room?.buildingId || "",
      floorId: (loc as any).floorId || loc.room?.floorId || "",
      roomId: loc.roomId || "",
      name: loc.name,
      code: loc.code,
      type: loc.type,
      description: loc.description || "",
    });
    setSelectedImage(null);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) {
      toast.error("Location name and unique code are required.");
      return;
    }

    try {
      const payloadData = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        type: form.type,
        roomId: form.roomId || undefined,
        floorId: form.floorId || undefined,
        buildingId: form.buildingId || undefined,
        description: form.description.trim() || undefined,
      };

      let body: FormData | Record<string, any>;
      if (selectedImage) {
        body = new FormData();
        body.append("data", JSON.stringify(payloadData));
        body.append("image", selectedImage);
      } else {
        body = payloadData;
      }

      await createLocation(body).unwrap();
      toast.success("Storage location created successfully.");
      setIsCreateOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create location.");
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLocation) return;
    if (!form.name.trim()) {
      toast.error("Location name is required.");
      return;
    }

    try {
      const payloadData = {
        name: form.name.trim(),
        type: form.type,
        roomId: form.roomId || undefined,
        floorId: form.floorId || undefined,
        buildingId: form.buildingId || undefined,
        description: form.description.trim() || undefined,
      };

      let body: FormData | Record<string, any>;
      if (selectedImage) {
        body = new FormData();
        body.append("data", JSON.stringify(payloadData));
        body.append("image", selectedImage);
      } else {
        body = payloadData;
      }

      await updateLocation({ id: editingLocation.id, body }).unwrap();
      toast.success("Storage location updated successfully.");
      setEditingLocation(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update location.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingLocation) return;
    const balances = deletingLocation._count?.stockBalances || 0;
    const units = deletingLocation._count?.inventoryUnits || 0;

    if (balances > 0 || units > 0) {
      toast.error(
        `Cannot delete storage location because it currently holds ${balances} stock balance item(s) and ${units} serialized unit(s). Move them first.`
      );
      setDeletingLocation(null);
      return;
    }

    try {
      await deleteLocation(deletingLocation.id).unwrap();
      toast.success("Storage location deleted successfully.");
      setDeletingLocation(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete storage location.");
    }
  };

  const getTypeBadgeColor = (type: LocationType) => {
    switch (type) {
      case "STORE":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300";
      case "ROOM":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300";
      case "RACK":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-300";
      case "SHELF":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300";
      case "CABINET":
        return "bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-300";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300";
    }
  };

  const columns: Column<IStockLocation>[] = [
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
      header: "Code & Name",
      render: (item) => (
        <div>
          <div className="flex items-center gap-2">
            <code className="text-xs font-mono font-bold bg-muted px-2 py-0.5 rounded border text-foreground">
              {item.code}
            </code>
            <span className="font-semibold text-foreground text-sm">{item.name}</span>
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
      key: "type",
      header: "Unit Type",
      render: (item) => (
        <Badge variant="outline" className={`text-[11px] font-semibold ${getTypeBadgeColor(item.type)}`}>
          {item.type}
        </Badge>
      ),
    },
    {
      key: "spatialLocation",
      header: "Spatial Location",
      render: (item) => {
        const room = item.room;
        const floor = item.room?.floor;
        const building = item.room?.floor?.building;

        return (
          <div className="text-xs text-muted-foreground space-y-0.5">
            <div className="flex items-center gap-1 text-foreground font-medium">
              <DoorClosed className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{room?.name || "General Room"}</span>
              {room?.code && <code className="text-[10px]">({room.code})</code>}
            </div>
            {(building || floor) && (
              <div className="flex items-center gap-1 text-[11px]">
                <Building2 className="w-3 h-3 text-muted-foreground/70" />
                <span>{building?.name || "Campus"}</span>
                {floor && <span>• L{floor.floorNumber}</span>}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "inventoryHeld",
      header: "Inventory Held",
      render: (item) => (
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1 text-muted-foreground" title="Bulk SKU Balances">
            <Boxes className="w-3.5 h-3.5 text-primary" />
            <span className="font-semibold text-foreground">
              {item._count?.stockBalances || 0}
            </span>
            <span>SKUs</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground" title="Serialized Physical Units">
            <QrCode className="w-3.5 h-3.5 text-indigo-500" />
            <span className="font-semibold text-foreground">
              {item._count?.inventoryUnits || 0}
            </span>
            <span>Units</span>
          </div>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (item) => (
        <div className="flex items-center gap-1">
          <Button asChild variant="ghost" size="sm" className="h-8 text-xs gap-1">
            <Link href={`/locations/stock/${item.id}`}>
              <span>Inventory</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </Button>
          <PermissionGate permissions={["location.update"]}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Edit Location"
              onClick={() => handleOpenEdit(item)}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
          </PermissionGate>
          <PermissionGate permissions={["location.delete"]}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:bg-destructive/10"
              title="Delete Location"
              onClick={() => setDeletingLocation(item)}
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
        title="Physical Storage Locations"
        description="Granular bins, racks, shelves, lockers, and storerooms where university items and serialized equipment are physically held."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Locations", href: "/locations/buildings" },
          { label: "Storage Units" },
        ]}
      >
        <PermissionGate permissions={["location.create"]}>
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="w-4 h-4" /> Add Storage Unit
          </Button>
        </PermissionGate>
      </PageHeader>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Storage Units
            </CardTitle>
            <Warehouse className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{locations.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Racks, shelves, and cabinets
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Stock SKU Positions
            </CardTitle>
            <Boxes className="w-4 h-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBalances}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active item balances stored
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Serialized Units Tracked
            </CardTitle>
            <QrCode className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUnits}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Barcoded/QR tagged individual units
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card className="border shadow-sm">
        <div className="p-4 border-b flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by code, shelf name, room..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            {/* Room Filter */}
            <div className="w-48">
              <Select
                value={selectedRoomId}
                onValueChange={(val) => setSelectedRoomId(val)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Filter by Room" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Rooms</SelectItem>
                  {allRooms.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name} ({r.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div className="w-36">
              <Select
                value={selectedType}
                onValueChange={(val) => setSelectedType(val)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  {LOCATION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Badge variant="secondary" className="text-xs shrink-0 self-start sm:self-center">
            {filteredLocations.length} {filteredLocations.length === 1 ? "Unit" : "Units"}
          </Badge>
        </div>

        <DataTable
          columns={columns}
          data={filteredLocations}
          isLoading={isLoading}
          emptyTitle="No storage locations found"
          emptyDescription="No storage locations found matching criteria. Add your first storage unit using the button above."
        />
      </Card>

      {/* Create Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader>
              <DialogTitle>Add Storage Location</DialogTitle>
              <DialogDescription>
                Define a rack, shelf, locker, or storage area in a campus room.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
              {/* Room Selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Parent Room / Lab <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.roomId}
                  onValueChange={(val) => {
                    const rm = allRooms.find((r) => r.id === val);
                    setForm({
                      ...form,
                      roomId: val,
                      floorId: rm?.floorId || "",
                      buildingId: rm?.buildingId || rm?.floor?.buildingId || "",
                    });
                  }}
                  required
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select room" />
                  </SelectTrigger>
                  <SelectContent>
                    {allRooms.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name} ({r.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Code & Name */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="loc-code" className="text-xs font-semibold">
                    Unit Code <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="loc-code"
                    placeholder="e.g. RACK-A1, SHELF-02"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="uppercase font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="loc-name" className="text-xs font-semibold">
                    Unit Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="loc-name"
                    placeholder="e.g. Microcontroller Shelf A"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Type */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Storage Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.type}
                  onValueChange={(val: LocationType) => setForm({ ...form, type: val })}
                  required
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATION_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="loc-desc" className="text-xs font-semibold">
                  Description / Stored Materials
                </Label>
                <Textarea
                  id="loc-desc"
                  placeholder="Notes on shelf capacity, ESD safety precautions, or locks..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                />
              </div>

              {/* Photo */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Unit Photo (Optional)</Label>
                <ImageUploader
                  value={null}
                  onChange={(file) => setSelectedImage(file)}
                  label="Upload Shelf / Unit Photo"
                  description="Helps custodians visually locate exact shelf or locker"
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
                  "Create Storage Unit"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editingLocation} onOpenChange={(open) => !open && setEditingLocation(null)}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleUpdateSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Storage Location</DialogTitle>
              <DialogDescription>
                Update details for {editingLocation?.code}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Unit Code</Label>
                  <Input value={editingLocation?.code || ""} disabled className="bg-muted font-mono" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-loc-name" className="text-xs font-semibold">
                    Unit Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-loc-name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Storage Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(val: LocationType) => setForm({ ...form, type: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATION_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-loc-desc" className="text-xs font-semibold">
                  Description
                </Label>
                <Textarea
                  id="edit-loc-desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Update Photo (Optional)</Label>
                <ImageUploader
                  value={editingLocation?.imageUrl}
                  onChange={(file) => setSelectedImage(file)}
                  label="Replace Unit Photo"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingLocation(null)}
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
        isOpen={!!deletingLocation}
        onClose={() => setDeletingLocation(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Storage Unit"
        description={
          (deletingLocation?._count?.stockBalances || 0) > 0 || (deletingLocation?._count?.inventoryUnits || 0) > 0 ? (
            <span className="text-destructive font-medium flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              This storage unit contains active inventory balances or serialized units and cannot be deleted until emptied.
            </span>
          ) : (
            `Are you sure you want to delete "${deletingLocation?.name}" (${deletingLocation?.code})? This action cannot be undone.`
          )
        }
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        variant="destructive"
      />
    </div>
  );
}

export default function StockLocationsPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading storage units...</div>}>
      <StockLocationsContent />
    </Suspense>
  );
}
