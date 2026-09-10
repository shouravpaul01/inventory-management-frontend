"use client";

import React, { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  DoorClosed,
  Plus,
  Edit2,
  Trash2,
  Building2,
  Layers,
  Search,
  Loader2,
  AlertCircle,
  ExternalLink,
  ImageIcon,
  Warehouse,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
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
  useGetAllRoomsQuery,
  useGetAllBuildingsQuery,
  useGetAllFloorsQuery,
  useGetAllRoomTypesQuery,
  useCreateRoomMutation,
  useUpdateRoomMutation,
  useDeleteRoomMutation,
} from "@/redux/api/locationsApi";
import { IRoom, RoomStatus } from "@/types";
import { toast } from "sonner";

function RoomsContent() {
  const searchParams = useSearchParams();
  const initialFloorId = searchParams.get("floorId") || "ALL";

  const { data: buildingsRes } = useGetAllBuildingsQuery();
  const { data: floorsRes } = useGetAllFloorsQuery();
  const { data: roomTypesRes } = useGetAllRoomTypesQuery();

  const buildings = useMemo(() => buildingsRes?.data || [], [buildingsRes]);
  const allFloors = useMemo(() => floorsRes?.data || [], [floorsRes]);
  const roomTypes = useMemo(() => roomTypesRes?.data || [], [roomTypesRes]);

  const [selectedBuildingId, setSelectedBuildingId] = useState<string>("ALL");
  const [selectedFloorId, setSelectedFloorId] = useState<string>(initialFloorId);
  const [selectedTypeId, setSelectedTypeId] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Available floors filtered by selected building
  const availableFloors = useMemo(() => {
    if (selectedBuildingId === "ALL") return allFloors;
    return allFloors.filter((f) => f.buildingId === selectedBuildingId);
  }, [allFloors, selectedBuildingId]);

  const queryParams = useMemo(() => {
    const params: Record<string, any> = {};
    if (selectedFloorId && selectedFloorId !== "ALL") params.floorId = selectedFloorId;
    if (selectedTypeId && selectedTypeId !== "ALL") params.roomTypeId = selectedTypeId;
    if (selectedStatus && selectedStatus !== "ALL") params.status = selectedStatus;
    return params;
  }, [selectedFloorId, selectedTypeId, selectedStatus]);

  const { data: roomsRes, isLoading, refetch } = useGetAllRoomsQuery(queryParams);
  const rooms = useMemo(() => roomsRes?.data || [], [roomsRes]);

  const [createRoom, { isLoading: isCreating }] = useCreateRoomMutation();
  const [updateRoom, { isLoading: isUpdating }] = useUpdateRoomMutation();
  const [deleteRoom, { isLoading: isDeleting }] = useDeleteRoomMutation();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<IRoom | null>(null);
  const [deletingRoom, setDeletingRoom] = useState<IRoom | null>(null);

  const [form, setForm] = useState({
    buildingId: "",
    floorId: "",
    roomTypeId: "",
    name: "",
    code: "",
    capacity: 30,
    description: "",
    status: "ACTIVE" as RoomStatus,
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  // Filtered rooms in memory for text search and building filter
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesBuilding =
        selectedBuildingId === "ALL" ||
        r.buildingId === selectedBuildingId ||
        r.floor?.buildingId === selectedBuildingId;

      return matchesSearch && matchesBuilding;
    });
  }, [rooms, searchTerm, selectedBuildingId]);

  const totalStockLocations = useMemo(() => {
    return rooms.reduce((sum, r) => sum + (r._count?.stockLocations || 0), 0);
  }, [rooms]);

  const handleOpenCreate = () => {
    const defaultBuilding = selectedBuildingId !== "ALL" ? selectedBuildingId : buildings[0]?.id || "";
    const floorsForBld = allFloors.filter((f) => !defaultBuilding || f.buildingId === defaultBuilding);
    const defaultFloor = selectedFloorId !== "ALL" ? selectedFloorId : floorsForBld[0]?.id || "";

    setForm({
      buildingId: defaultBuilding,
      floorId: defaultFloor,
      roomTypeId: roomTypes[0]?.id || "",
      name: "",
      code: "",
      capacity: 30,
      description: "",
      status: "ACTIVE",
    });
    setSelectedImage(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (room: IRoom) => {
    setEditingRoom(room);
    setForm({
      buildingId: room.buildingId || room.floor?.buildingId || "",
      floorId: room.floorId,
      roomTypeId: room.roomTypeId || "",
      name: room.name,
      code: room.code,
      capacity: (room as any).capacity || 0,
      description: room.description || "",
      status: room.status,
    });
    setSelectedImage(null);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.floorId || !form.name.trim() || !form.code.trim()) {
      toast.error("Floor, room name, and code are required.");
      return;
    }

    try {
      const payloadData = {
        floorId: form.floorId,
        roomTypeId: form.roomTypeId || undefined,
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        capacity: Number(form.capacity) || undefined,
        description: form.description.trim() || undefined,
        status: form.status,
      };

      let body: FormData | Record<string, any>;
      if (selectedImage) {
        body = new FormData();
        body.append("data", JSON.stringify(payloadData));
        body.append("image", selectedImage);
      } else {
        body = payloadData;
      }

      await createRoom(body).unwrap();
      toast.success("Room created successfully.");
      setIsCreateOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create room.");
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;
    if (!form.name.trim()) {
      toast.error("Room name is required.");
      return;
    }

    try {
      const payloadData = {
        floorId: form.floorId || undefined,
        roomTypeId: form.roomTypeId || undefined,
        name: form.name.trim(),
        capacity: Number(form.capacity) || undefined,
        description: form.description.trim() || undefined,
        status: form.status,
      };

      let body: FormData | Record<string, any>;
      if (selectedImage) {
        body = new FormData();
        body.append("data", JSON.stringify(payloadData));
        body.append("image", selectedImage);
      } else {
        body = payloadData;
      }

      await updateRoom({ id: editingRoom.id, body }).unwrap();
      toast.success("Room updated successfully.");
      setEditingRoom(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update room.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingRoom) return;
    if (deletingRoom._count?.stockLocations && deletingRoom._count.stockLocations > 0) {
      toast.error(
        `Cannot delete room because it contains ${deletingRoom._count.stockLocations} storage unit(s). Reassign or remove them first.`
      );
      setDeletingRoom(null);
      return;
    }

    try {
      await deleteRoom(deletingRoom.id).unwrap();
      toast.success("Room deleted successfully.");
      setDeletingRoom(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete room.");
    }
  };

  const columns: Column<IRoom>[] = [
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
      key: "location",
      header: "Location",
      render: (item) => (
        <div className="text-xs space-y-0.5">
          <div className="flex items-center gap-1.5 text-foreground font-medium">
            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
            <span>{item.building?.name || item.floor?.building?.name || "Campus Facility"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Layers className="w-3.5 h-3.5" />
            <span>{item.floor?.name || `Floor ${item.floor?.floorNumber || ""}`}</span>
          </div>
        </div>
      ),
    },
    {
      key: "classification",
      header: "Classification",
      render: (item) => (
        <Badge variant="outline" className="text-xs font-medium">
          {item.roomType?.name || "General Space"}
        </Badge>
      ),
    },
    {
      key: "capacity",
      header: "Capacity",
      render: (item) => (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="w-3.5 h-3.5 text-muted-foreground" />
          <span>{(item as any).capacity ? `${(item as any).capacity} seats` : "—"}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: "storageUnits",
      header: "Storage Units",
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Warehouse className="w-3.5 h-3.5 text-primary" />
          <span className="font-semibold text-foreground">
            {item._count?.stockLocations || 0}
          </span>
          <span>Units</span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (item) => (
        <div className="flex items-center gap-1">
          <Button asChild variant="ghost" size="sm" className="h-8 text-xs gap-1">
            <Link href={`/locations/stock?roomId=${item.id}`}>
              <span>Storage</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </Button>
          <PermissionGate permissions={["location.update"]}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Edit Room"
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
              title="Delete Room"
              onClick={() => setDeletingRoom(item)}
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
        title="Campus Rooms & Labs"
        description="Physical rooms, science laboratories, lecture halls, and departmental spaces housing storage units and equipment."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Locations", href: "/locations/buildings" },
          { label: "Rooms" },
        ]}
      >
        <PermissionGate permissions={["location.create"]}>
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="w-4 h-4" /> Add Room
          </Button>
        </PermissionGate>
      </PageHeader>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Rooms & Labs
            </CardTitle>
            <DoorClosed className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rooms.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Registered academic and operational spaces
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Storage Sub-locations
            </CardTitle>
            <Warehouse className="w-4 h-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStockLocations}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Racks, shelves, and lockers inside rooms
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Spaces
            </CardTitle>
            <StatusBadge status="ACTIVE" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rooms.filter((r) => r.status === "ACTIVE").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Operational spaces open for storage
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
                placeholder="Search rooms by name, code, or details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Building Filter */}
              <div className="w-44">
                <Select
                  value={selectedBuildingId}
                  onValueChange={(val) => {
                    setSelectedBuildingId(val);
                    setSelectedFloorId("ALL");
                  }}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="All Buildings" />
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

              {/* Floor Filter */}
              <div className="w-40">
                <Select
                  value={selectedFloorId}
                  onValueChange={(val) => setSelectedFloorId(val)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="All Floors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Floors</SelectItem>
                    {availableFloors.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name} (L{f.floorNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Room Type Filter */}
              <div className="w-40">
                <Select
                  value={selectedTypeId}
                  onValueChange={(val) => setSelectedTypeId(val)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    {roomTypes.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="w-32">
                <Select
                  value={selectedStatus}
                  onValueChange={(val) => setSelectedStatus(val)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                    <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredRooms}
          isLoading={isLoading}
          emptyTitle="No rooms found"
          emptyDescription="No rooms found matching the selected filters. Add your first room using the button above."
        />
      </Card>

      {/* Create Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader>
              <DialogTitle>Add Campus Room / Lab</DialogTitle>
              <DialogDescription>
                Register a new classroom, lab, or office in a campus building.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
              {/* Building & Floor Selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Building</Label>
                  <Select
                    value={form.buildingId}
                    onValueChange={(val) => {
                      const floorsForBld = allFloors.filter((f) => f.buildingId === val);
                      setForm({
                        ...form,
                        buildingId: val,
                        floorId: floorsForBld[0]?.id || "",
                      });
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Select building" />
                    </SelectTrigger>
                    <SelectContent>
                      {buildings.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Floor <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.floorId}
                    onValueChange={(val) => setForm({ ...form, floorId: val })}
                    required
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Select floor" />
                    </SelectTrigger>
                    <SelectContent>
                      {allFloors
                        .filter((f) => !form.buildingId || f.buildingId === form.buildingId)
                        .map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.name} (L{f.floorNumber})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Code and Name */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="rm-code" className="text-xs font-semibold">
                    Room Code <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="rm-code"
                    placeholder="e.g. LAB-301, RM-102"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="uppercase font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="rm-name" className="text-xs font-semibold">
                    Room Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="rm-name"
                    placeholder="e.g. Robotics & AI Lab"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Classification and Capacity */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Classification Type</Label>
                  <Select
                    value={form.roomTypeId}
                    onValueChange={(val) => setForm({ ...form, roomTypeId: val })}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Select classification" />
                    </SelectTrigger>
                    <SelectContent>
                      {roomTypes.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="rm-cap" className="text-xs font-semibold">
                    Capacity (Seats)
                  </Label>
                  <Input
                    id="rm-cap"
                    type="number"
                    placeholder="e.g. 40"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Operational Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(val: RoomStatus) => setForm({ ...form, status: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                    <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="rm-desc" className="text-xs font-semibold">
                  Description / Notes
                </Label>
                <Textarea
                  id="rm-desc"
                  placeholder="Usage rules, safety notes, access equipment..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                />
              </div>

              {/* Photo */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Room Photo (Optional)</Label>
                <ImageUploader
                  value={null}
                  onChange={(file) => setSelectedImage(file)}
                  label="Upload Space Photo"
                  description="High-resolution image of room entrance or interior (PNG, JPG up to 5MB)"
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
                  "Create Room"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editingRoom} onOpenChange={(open) => !open && setEditingRoom(null)}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleUpdateSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Room / Lab</DialogTitle>
              <DialogDescription>
                Update details for {editingRoom?.code}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Room Code</Label>
                  <Input value={editingRoom?.code || ""} disabled className="bg-muted font-mono" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-rm-name" className="text-xs font-semibold">
                    Room Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-rm-name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Classification Type</Label>
                  <Select
                    value={form.roomTypeId}
                    onValueChange={(val) => setForm({ ...form, roomTypeId: val })}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Select classification" />
                    </SelectTrigger>
                    <SelectContent>
                      {roomTypes.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-rm-cap" className="text-xs font-semibold">
                    Capacity (Seats)
                  </Label>
                  <Input
                    id="edit-rm-cap"
                    type="number"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Operational Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(val: RoomStatus) => setForm({ ...form, status: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                    <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-rm-desc" className="text-xs font-semibold">
                  Description
                </Label>
                <Textarea
                  id="edit-rm-desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Update Photo (Optional)</Label>
                <ImageUploader
                  value={editingRoom?.imageUrl}
                  onChange={(file) => setSelectedImage(file)}
                  label="Replace Space Photo"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingRoom(null)}
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
        isOpen={!!deletingRoom}
        onClose={() => setDeletingRoom(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Room"
        description={
          deletingRoom?._count?.stockLocations && deletingRoom._count.stockLocations > 0 ? (
            <span className="text-destructive font-medium flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              This room contains {deletingRoom._count.stockLocations} storage unit(s) and cannot be deleted until they are reassigned or removed.
            </span>
          ) : (
            `Are you sure you want to delete "${deletingRoom?.name}" (${deletingRoom?.code})? This action cannot be undone.`
          )
        }
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        variant="destructive"
      />
    </div>
  );
}

export default function RoomsPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading rooms...</div>}>
      <RoomsContent />
    </Suspense>
  );
}
