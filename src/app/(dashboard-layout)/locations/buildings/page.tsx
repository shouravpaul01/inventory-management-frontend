"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Layers,
  MapPin,
  Search,
  Loader2,
  AlertCircle,
  ExternalLink,
  ImageIcon,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PermissionGate } from "@/components/shared/permissions/PermissionGate";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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
  useGetAllBuildingsQuery,
  useCreateBuildingMutation,
  useUpdateBuildingMutation,
  useDeleteBuildingMutation,
} from "@/redux/api/locationsApi";
import { IBuilding } from "@/types";
import { toast } from "sonner";

export default function BuildingsPage() {
  const { data: buildingsRes, isLoading, refetch } = useGetAllBuildingsQuery();
  const buildings = useMemo(() => buildingsRes?.data || [], [buildingsRes]);

  const [createBuilding, { isLoading: isCreating }] = useCreateBuildingMutation();
  const [updateBuilding, { isLoading: isUpdating }] = useUpdateBuildingMutation();
  const [deleteBuilding, { isLoading: isDeleting }] = useDeleteBuildingMutation();

  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<IBuilding | null>(null);
  const [deletingBuilding, setDeletingBuilding] = useState<IBuilding | null>(null);

  const [form, setForm] = useState({
    name: "",
    code: "",
    address: "",
    description: "",
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const filteredBuildings = useMemo(() => {
    return buildings.filter(
      (b) =>
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.code.toLowerCase().includes(search.toLowerCase()) ||
        (b.description && b.description.toLowerCase().includes(search.toLowerCase()))
    );
  }, [buildings, search]);

  const totalFloors = useMemo(() => {
    return buildings.reduce((sum, b) => sum + (b._count?.floors || 0), 0);
  }, [buildings]);

  const handleOpenCreate = () => {
    setForm({ name: "", code: "", address: "", description: "" });
    setSelectedImage(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (b: IBuilding) => {
    setEditingBuilding(b);
    setForm({
      name: b.name,
      code: b.code,
      address: (b as any).address || "",
      description: b.description || "",
    });
    setSelectedImage(null);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) {
      toast.error("Building name and unique code are required.");
      return;
    }

    try {
      const payloadData = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        address: form.address.trim() || undefined,
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

      await createBuilding(body).unwrap();
      toast.success("Building created successfully.");
      setIsCreateOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create building.");
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBuilding) return;
    if (!form.name.trim()) {
      toast.error("Building name is required.");
      return;
    }

    try {
      const payloadData = {
        name: form.name.trim(),
        address: form.address.trim() || undefined,
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

      await updateBuilding({ id: editingBuilding.id, body }).unwrap();
      toast.success("Building updated successfully.");
      setEditingBuilding(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update building.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingBuilding) return;
    if (deletingBuilding._count?.floors && deletingBuilding._count.floors > 0) {
      toast.error(
        `Cannot delete building because it contains ${deletingBuilding._count.floors} floor(s). Delete or reassign floors first.`
      );
      setDeletingBuilding(null);
      return;
    }

    try {
      await deleteBuilding(deletingBuilding.id).unwrap();
      toast.success("Building deleted successfully.");
      setDeletingBuilding(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete building.");
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Campus Buildings"
        description="Physical buildings and academic facilities across the university campus that house departmental offices, science labs, and centralized inventory stores."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Locations" },
          { label: "Buildings" },
        ]}
      >
        <PermissionGate permissions={["location.create"]}>
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="w-4 h-4" /> Add Building
          </Button>
        </PermissionGate>
      </PageHeader>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Buildings
            </CardTitle>
            <Building2 className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{buildings.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Registered campus complexes
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Floors
            </CardTitle>
            <Layers className="w-4 h-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFloors}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Storeys across all campus buildings
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Filter Matches
            </CardTitle>
            <MapPin className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredBuildings.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Buildings matching search criteria
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="border shadow-sm">
        <div className="p-4 border-b flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search buildings by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Badge variant="secondary" className="text-xs shrink-0">
            {filteredBuildings.length} {filteredBuildings.length === 1 ? "Building" : "Buildings"}
          </Badge>
        </div>

        {/* Building Cards Grid */}
        <div className="p-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 rounded-xl bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : filteredBuildings.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="font-semibold text-lg text-foreground">No buildings found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Add your first campus building using the button above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBuildings.map((b) => (
                <Card
                  key={b.id}
                  className="overflow-hidden border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    {/* Building Image or Placeholder */}
                    <div className="relative h-44 w-full bg-muted flex items-center justify-center overflow-hidden border-b">
                      {b.imageUrl ? (
                        <Image
                          src={b.imageUrl}
                          alt={b.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-muted-foreground/50">
                          <ImageIcon className="w-12 h-12 mb-1" />
                          <span className="text-xs">No preview photo</span>
                        </div>
                      )}
                      <div className="absolute top-2.5 left-2.5">
                        <code className="text-xs font-mono font-bold bg-background/90 backdrop-blur-xs px-2 py-1 rounded shadow-xs border">
                          {b.code}
                        </code>
                      </div>
                    </div>

                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base font-bold text-foreground line-clamp-1">
                          {b.name}
                        </CardTitle>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1 min-h-[32px]">
                        {b.description || "No specific physical complex notes recorded."}
                      </p>
                    </CardHeader>

                    <CardContent className="px-4 py-2 text-xs space-y-2">
                      {(b as any).address && (
                        <div className="flex items-center gap-1.5 text-muted-foreground line-clamp-1">
                          <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>{(b as any).address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Layers className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="font-semibold text-foreground">
                          {b._count?.floors || 0}
                        </span>
                        <span>Floors configured</span>
                      </div>
                    </CardContent>
                  </div>

                  <CardFooter className="p-4 pt-2 border-t bg-muted/10 flex items-center justify-between">
                    <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                      <Link href={`/locations/floors?buildingId=${b.id}`}>
                        <span>Explore Floors</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </Button>

                    <div className="flex items-center gap-1">
                      <PermissionGate permissions={["location.update"]}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Edit Building"
                          onClick={() => handleOpenEdit(b)}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                      </PermissionGate>
                      <PermissionGate permissions={["location.delete"]}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          title="Delete Building"
                          onClick={() => setDeletingBuilding(b)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </PermissionGate>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Create Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader>
              <DialogTitle>Add Campus Building</DialogTitle>
              <DialogDescription>
                Register a new building structure or facility for spatial tracking.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="bld-code" className="text-xs font-semibold">
                    Building Code <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="bld-code"
                    placeholder="e.g. ENG-01"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="uppercase font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bld-name" className="text-xs font-semibold">
                    Building Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="bld-name"
                    placeholder="e.g. Engineering Complex"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bld-addr" className="text-xs font-semibold">
                  Campus Address / Sector
                </Label>
                <Input
                  id="bld-addr"
                  placeholder="e.g. North Campus, Gate 2"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bld-desc" className="text-xs font-semibold">
                  Description
                </Label>
                <Textarea
                  id="bld-desc"
                  placeholder="Notes about this facility..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Building Photo (Optional)</Label>
                <ImageUploader
                  value={null}
                  onChange={(file) => setSelectedImage(file)}
                  label="Upload Facility Photo"
                  description="High resolution photo for facility identification (PNG, JPG up to 5MB)"
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
                  "Create Building"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editingBuilding} onOpenChange={(open) => !open && setEditingBuilding(null)}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleUpdateSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Campus Building</DialogTitle>
              <DialogDescription>
                Update details for {editingBuilding?.code}. Code cannot be changed.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Building Code</Label>
                  <Input value={editingBuilding?.code || ""} disabled className="bg-muted font-mono" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-bld-name" className="text-xs font-semibold">
                    Building Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-bld-name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-bld-addr" className="text-xs font-semibold">
                  Campus Address / Sector
                </Label>
                <Input
                  id="edit-bld-addr"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-bld-desc" className="text-xs font-semibold">
                  Description
                </Label>
                <Textarea
                  id="edit-bld-desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Update Photo (Optional)</Label>
                <ImageUploader
                  value={editingBuilding?.imageUrl}
                  onChange={(file) => setSelectedImage(file)}
                  label="Replace Facility Photo"
                  description="Upload a new photo to replace current image"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingBuilding(null)}
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
        isOpen={!!deletingBuilding}
        onClose={() => setDeletingBuilding(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Building"
        description={
          deletingBuilding?._count?.floors && deletingBuilding._count.floors > 0 ? (
            <span className="text-destructive font-medium flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              This building contains {deletingBuilding._count.floors} floor(s) and cannot be deleted until floors are removed.
            </span>
          ) : (
            `Are you sure you want to delete "${deletingBuilding?.name}" (${deletingBuilding?.code})? This action cannot be undone.`
          )
        }
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        variant="destructive"
      />
    </div>
  );
}
