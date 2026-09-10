"use client";

import React, { useState, useMemo } from "react";
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  DoorClosed,
  Search,
  Loader2,
  AlertCircle,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useGetAllRoomTypesQuery,
  useCreateRoomTypeMutation,
  useUpdateRoomTypeMutation,
  useDeleteRoomTypeMutation,
} from "@/redux/api/locationsApi";
import { IRoomType } from "@/types";
import { toast } from "sonner";

export default function RoomTypesPage() {
  const { data: typesRes, isLoading, refetch } = useGetAllRoomTypesQuery();
  const roomTypes = useMemo(() => typesRes?.data || [], [typesRes]);

  const [createType, { isLoading: isCreating }] = useCreateRoomTypeMutation();
  const [updateType, { isLoading: isUpdating }] = useUpdateRoomTypeMutation();
  const [deleteType, { isLoading: isDeleting }] = useDeleteRoomTypeMutation();

  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingType, setEditingType] = useState<IRoomType | null>(null);
  const [deletingType, setDeletingType] = useState<IRoomType | null>(null);

  const [form, setForm] = useState({ name: "", code: "", description: "" });

  const filteredTypes = useMemo(() => {
    return roomTypes.filter(
      (t) =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.code.toLowerCase().includes(search.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(search.toLowerCase()))
    );
  }, [roomTypes, search]);

  const totalAssignedRooms = useMemo(() => {
    return roomTypes.reduce((sum, t) => sum + (t._count?.rooms || 0), 0);
  }, [roomTypes]);

  const handleOpenCreate = () => {
    setForm({ name: "", code: "", description: "" });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (rt: IRoomType) => {
    setEditingType(rt);
    setForm({
      name: rt.name,
      code: rt.code,
      description: rt.description || "",
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) {
      toast.error("Room type name and code are required.");
      return;
    }

    try {
      await createType({
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        description: form.description.trim() || undefined,
      }).unwrap();
      toast.success("Room type created successfully.");
      setIsCreateOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create room type.");
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingType) return;
    if (!form.name.trim()) {
      toast.error("Room type name is required.");
      return;
    }

    try {
      await updateType({
        id: editingType.id,
        body: {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
        },
      }).unwrap();
      toast.success("Room type updated successfully.");
      setEditingType(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update room type.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingType) return;
    if (deletingType._count?.rooms && deletingType._count.rooms > 0) {
      toast.error(
        `Cannot delete room type because ${deletingType._count.rooms} room(s) use it.`
      );
      setDeletingType(null);
      return;
    }

    try {
      await deleteType(deletingType.id).unwrap();
      toast.success("Room type deleted successfully.");
      setDeletingType(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete room type.");
    }
  };

  const columns: Column<IRoomType>[] = [
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
      header: "Type Name",
      render: (item) => (
        <div>
          <div className="font-semibold text-foreground">{item.name}</div>
          {item.description && (
            <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {item.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "rooms",
      header: "Associated Rooms",
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <DoorClosed className="w-3.5 h-3.5 text-primary" />
          <span className="font-semibold text-foreground">{item._count?.rooms || 0}</span>
          <span>Rooms</span>
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (item) => (
        <span className="text-xs text-muted-foreground">
          {new Date(item.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (item) => (
        <div className="flex items-center gap-1">
          <PermissionGate permissions={["location.update"]}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Edit Room Type"
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
              title="Delete Room Type"
              onClick={() => setDeletingType(item)}
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
        title="Room Classifications & Types"
        description="Standardized classification tags for university spaces (e.g. Research Lab, Classroom, Faculty Office, IT Server Room, Central Storage)."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Locations", href: "/locations/buildings" },
          { label: "Room Types" },
        ]}
      >
        <PermissionGate permissions={["location.create"]}>
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="w-4 h-4" /> Add Room Type
          </Button>
        </PermissionGate>
      </PageHeader>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Classifications
            </CardTitle>
            <Tag className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roomTypes.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active facility space categories
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Categorized Rooms
            </CardTitle>
            <DoorClosed className="w-4 h-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssignedRooms}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Rooms linked to classifications
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Filter Matches
            </CardTitle>
            <Search className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredTypes.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Types matching search query
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}
      <Card className="border shadow-sm">
        <div className="p-4 border-b flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search room types by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Badge variant="secondary" className="text-xs shrink-0">
            {filteredTypes.length} {filteredTypes.length === 1 ? "Type" : "Types"}
          </Badge>
        </div>

        <DataTable
          columns={columns}
          data={filteredTypes}
          isLoading={isLoading}
          emptyTitle="No room types found"
          emptyDescription="Add your first room type using the button above."
        />
      </Card>

      {/* Create Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader>
              <DialogTitle>Add Room Type</DialogTitle>
              <DialogDescription>
                Define a standard spatial category across university buildings.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="rt-code" className="text-xs font-semibold">
                  Type Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="rt-code"
                  placeholder="e.g. LAB, LECTURE, OFFICE, STORE"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="uppercase font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rt-name" className="text-xs font-semibold">
                  Type Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="rt-name"
                  placeholder="e.g. Computer Science Laboratory"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rt-desc" className="text-xs font-semibold">
                  Description
                </Label>
                <Textarea
                  id="rt-desc"
                  placeholder="Typical usage, equipment types, safety requirements..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
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
                  "Create Type"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editingType} onOpenChange={(open) => !open && setEditingType(null)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleUpdateSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Room Type</DialogTitle>
              <DialogDescription>
                Update details for {editingType?.code}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Type Code</Label>
                <Input value={editingType?.code || ""} disabled className="bg-muted font-mono" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-rt-name" className="text-xs font-semibold">
                  Type Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-rt-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-rt-desc" className="text-xs font-semibold">
                  Description
                </Label>
                <Textarea
                  id="edit-rt-desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingType(null)}
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
        isOpen={!!deletingType}
        onClose={() => setDeletingType(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Room Type"
        description={
          deletingType?._count?.rooms && deletingType._count.rooms > 0 ? (
            <span className="text-destructive font-medium flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              This room type is currently used by {deletingType._count.rooms} room(s) and cannot be deleted.
            </span>
          ) : (
            `Are you sure you want to delete "${deletingType?.name}" (${deletingType?.code})? This action cannot be undone.`
          )
        }
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        variant="destructive"
      />
    </div>
  );
}
