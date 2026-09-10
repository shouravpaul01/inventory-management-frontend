"use client";

import React, { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Layers,
  Building2,
  Plus,
  Edit2,
  Trash2,
  DoorClosed,
  Search,
  Loader2,
  AlertCircle,
  ExternalLink,
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
  useGetAllFloorsQuery,
  useGetAllBuildingsQuery,
  useCreateFloorMutation,
  useUpdateFloorMutation,
  useDeleteFloorMutation,
} from "@/redux/api/locationsApi";
import { IFloor } from "@/types";
import { toast } from "sonner";

function FloorsContent() {
  const searchParams = useSearchParams();
  const initialBuildingId = searchParams.get("buildingId") || "ALL";

  const { data: buildingsRes } = useGetAllBuildingsQuery();
  const buildings = useMemo(() => buildingsRes?.data || [], [buildingsRes]);

  const [selectedBuildingId, setSelectedBuildingId] = useState<string>(initialBuildingId);
  const [searchTerm, setSearchTerm] = useState("");

  const queryParams = useMemo(() => {
    const params: Record<string, any> = {};
    if (selectedBuildingId && selectedBuildingId !== "ALL") {
      params.buildingId = selectedBuildingId;
    }
    return params;
  }, [selectedBuildingId]);

  const { data: floorsRes, isLoading, refetch } = useGetAllFloorsQuery(queryParams);
  const floors = useMemo(() => floorsRes?.data || [], [floorsRes]);

  const [createFloor, { isLoading: isCreating }] = useCreateFloorMutation();
  const [updateFloor, { isLoading: isUpdating }] = useUpdateFloorMutation();
  const [deleteFloor, { isLoading: isDeleting }] = useDeleteFloorMutation();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingFloor, setEditingFloor] = useState<IFloor | null>(null);
  const [deletingFloor, setDeletingFloor] = useState<IFloor | null>(null);

  const [form, setForm] = useState({
    buildingId: "",
    name: "",
    code: "",
    floorNumber: 0,
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const filteredFloors = useMemo(() => {
    return floors.filter((f) => {
      const matchesSearch =
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.building?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesBuilding =
        selectedBuildingId === "ALL" || f.buildingId === selectedBuildingId;

      return matchesSearch && matchesBuilding;
    });
  }, [floors, searchTerm, selectedBuildingId]);

  const totalRooms = useMemo(() => {
    return floors.reduce((sum, f) => sum + (f._count?.rooms || 0), 0);
  }, [floors]);

  const handleOpenCreate = () => {
    setForm({
      buildingId: selectedBuildingId !== "ALL" ? selectedBuildingId : buildings[0]?.id || "",
      name: "",
      code: "",
      floorNumber: 1,
    });
    setSelectedImage(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (floor: IFloor) => {
    setEditingFloor(floor);
    setForm({
      buildingId: floor.buildingId,
      name: floor.name,
      code: floor.code,
      floorNumber: floor.floorNumber,
    });
    setSelectedImage(null);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.buildingId || !form.name.trim() || !form.code.trim()) {
      toast.error("Building, floor name, and floor code are required.");
      return;
    }

    try {
      const payloadData = {
        buildingId: form.buildingId,
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        floorNumber: Number(form.floorNumber),
      };

      let body: FormData | Record<string, any>;
      if (selectedImage) {
        body = new FormData();
        body.append("data", JSON.stringify(payloadData));
        body.append("image", selectedImage);
      } else {
        body = payloadData;
      }

      await createFloor(body).unwrap();
      toast.success("Floor created successfully.");
      setIsCreateOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create floor.");
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFloor) return;
    if (!form.name.trim()) {
      toast.error("Floor name is required.");
      return;
    }

    try {
      const payloadData = {
        name: form.name.trim(),
        floorNumber: Number(form.floorNumber),
      };

      let body: FormData | Record<string, any>;
      if (selectedImage) {
        body = new FormData();
        body.append("data", JSON.stringify(payloadData));
        body.append("image", selectedImage);
      } else {
        body = payloadData;
      }

      await updateFloor({ id: editingFloor.id, body }).unwrap();
      toast.success("Floor updated successfully.");
      setEditingFloor(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update floor.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingFloor) return;
    if (deletingFloor._count?.rooms && deletingFloor._count.rooms > 0) {
      toast.error(
        `Cannot delete floor because it contains ${deletingFloor._count.rooms} room(s). Remove rooms first.`
      );
      setDeletingFloor(null);
      return;
    }

    try {
      await deleteFloor(deletingFloor.id).unwrap();
      toast.success("Floor deleted successfully.");
      setDeletingFloor(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete floor.");
    }
  };

  const columns: Column<IFloor>[] = [
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
      header: "Floor Name & Level",
      render: (item) => (
        <div>
          <div className="font-semibold text-foreground flex items-center gap-2">
            <span>{item.name}</span>
            <Badge variant="outline" className="text-[11px] font-mono">
              Level {item.floorNumber}
            </Badge>
          </div>
        </div>
      ),
    },
    {
      key: "building",
      header: "Building",
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs">
          <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="font-medium">{item.building?.name || "Unassigned"}</span>
          {item.building?.code && (
            <code className="text-[10px] text-muted-foreground">({item.building.code})</code>
          )}
        </div>
      ),
    },
    {
      key: "rooms",
      header: "Rooms",
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <DoorClosed className="w-3.5 h-3.5 text-primary" />
          <span className="font-semibold text-foreground">{item._count?.rooms || 0}</span>
          <span>Rooms</span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (item) => (
        <div className="flex items-center gap-1">
          <Button asChild variant="ghost" size="sm" className="h-8 text-xs gap-1">
            <Link href={`/locations/rooms?floorId=${item.id}`}>
              <span>View Rooms</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </Button>
          <PermissionGate permissions={["location.update"]}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Edit Floor"
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
              title="Delete Floor"
              onClick={() => setDeletingFloor(item)}
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
        title="Building Floors"
        description="Storey and level definitions within university campus buildings."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Locations", href: "/locations/buildings" },
          { label: "Floors" },
        ]}
      >
        <PermissionGate permissions={["location.create"]}>
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="w-4 h-4" /> Add Floor
          </Button>
        </PermissionGate>
      </PageHeader>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Floors
            </CardTitle>
            <Layers className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{floors.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Storeys across campus complexes
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Rooms
            </CardTitle>
            <DoorClosed className="w-4 h-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRooms}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Classrooms, labs, and offices
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Building Filter
            </CardTitle>
            <Building2 className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-base font-semibold truncate">
              {selectedBuildingId === "ALL"
                ? "All Campus Buildings"
                : buildings.find((b) => b.id === selectedBuildingId)?.name || "Selected"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {filteredFloors.length} floor(s) displayed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Table */}
      <Card className="border shadow-sm">
        <div className="p-4 border-b flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search floors by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            <div className="w-56">
              <Select
                value={selectedBuildingId}
                onValueChange={(val) => setSelectedBuildingId(val)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Filter by Building" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Buildings</SelectItem>
                  {buildings.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Badge variant="secondary" className="text-xs shrink-0 self-start sm:self-center">
            {filteredFloors.length} {filteredFloors.length === 1 ? "Floor" : "Floors"}
          </Badge>
        </div>

        <DataTable
          columns={columns}
          data={filteredFloors}
          isLoading={isLoading}
          emptyTitle="No floors found"
          emptyDescription="No floors found for the selected building. Add your first floor using the button above."
        />
      </Card>

      {/* Create Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader>
              <DialogTitle>Add Building Floor</DialogTitle>
              <DialogDescription>
                Define a new floor level in a campus facility.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Parent Building <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.buildingId}
                  onValueChange={(val) => setForm({ ...form, buildingId: val })}
                  required
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select building" />
                  </SelectTrigger>
                  <SelectContent>
                    {buildings.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="fl-code" className="text-xs font-semibold">
                    Floor Code <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="fl-code"
                    placeholder="e.g. ENG-F1"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="uppercase font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="fl-num" className="text-xs font-semibold">
                    Floor Level Number
                  </Label>
                  <Input
                    id="fl-num"
                    type="number"
                    placeholder="e.g. 1"
                    value={form.floorNumber}
                    onChange={(e) => setForm({ ...form, floorNumber: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fl-name" className="text-xs font-semibold">
                  Floor Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fl-name"
                  placeholder="e.g. First Floor / Ground Level"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Floor Plan / Photo (Optional)</Label>
                <ImageUploader
                  value={null}
                  onChange={(file) => setSelectedImage(file)}
                  label="Upload Floor Plan"
                  description="Floor map or photo (PNG, JPG up to 5MB)"
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
                  "Create Floor"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editingFloor} onOpenChange={(open) => !open && setEditingFloor(null)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleUpdateSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Floor</DialogTitle>
              <DialogDescription>
                Update details for {editingFloor?.code}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Floor Code</Label>
                  <Input value={editingFloor?.code || ""} disabled className="bg-muted font-mono" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-fl-num" className="text-xs font-semibold">
                    Floor Level Number
                  </Label>
                  <Input
                    id="edit-fl-num"
                    type="number"
                    value={form.floorNumber}
                    onChange={(e) => setForm({ ...form, floorNumber: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-fl-name" className="text-xs font-semibold">
                  Floor Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-fl-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Update Plan / Photo (Optional)</Label>
                <ImageUploader
                  value={editingFloor?.imageUrl}
                  onChange={(file) => setSelectedImage(file)}
                  label="Replace Floor Plan"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingFloor(null)}
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
        isOpen={!!deletingFloor}
        onClose={() => setDeletingFloor(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Floor"
        description={
          deletingFloor?._count?.rooms && deletingFloor._count.rooms > 0 ? (
            <span className="text-destructive font-medium flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              This floor contains {deletingFloor._count.rooms} room(s) and cannot be deleted until rooms are removed.
            </span>
          ) : (
            `Are you sure you want to delete "${deletingFloor?.name}" (${deletingFloor?.code})? This action cannot be undone.`
          )
        }
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        variant="destructive"
      />
    </div>
  );
}

export default function FloorsPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading floors...</div>}>
      <FloorsContent />
    </Suspense>
  );
}
