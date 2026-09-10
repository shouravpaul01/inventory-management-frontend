"use client";

import React, { useState, useMemo } from "react";
import {
  Building,
  Plus,
  Edit2,
  Trash2,
  Users,
  Search,
  Loader2,
  AlertCircle,
  GraduationCap,
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
  useGetAllDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
} from "@/redux/api/departmentsApi";
import { IDepartment } from "@/types";
import { toast } from "sonner";

export default function DepartmentsPage() {
  const { data: deptRes, isLoading, refetch } = useGetAllDepartmentsQuery();
  const departments = useMemo(() => deptRes?.data || [], [deptRes]);

  const [createDept, { isLoading: isCreating }] = useCreateDepartmentMutation();
  const [updateDept, { isLoading: isUpdating }] = useUpdateDepartmentMutation();
  const [deleteDept, { isLoading: isDeleting }] = useDeleteDepartmentMutation();

  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<IDepartment | null>(null);
  const [deletingDept, setDeletingDept] = useState<IDepartment | null>(null);

  const [form, setForm] = useState({ name: "", code: "", description: "" });

  const filteredDepts = useMemo(() => {
    return departments.filter(
      (d) =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.code.toLowerCase().includes(search.toLowerCase()) ||
        (d.description && d.description.toLowerCase().includes(search.toLowerCase()))
    );
  }, [departments, search]);

  const totalUsers = useMemo(() => {
    return departments.reduce((sum, d) => sum + (d._count?.users || 0), 0);
  }, [departments]);

  const handleOpenCreate = () => {
    setForm({ name: "", code: "", description: "" });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (dept: IDepartment) => {
    setEditingDept(dept);
    setForm({
      name: dept.name,
      code: dept.code,
      description: dept.description || "",
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) {
      toast.error("Department name and code are required.");
      return;
    }

    try {
      await createDept({
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        description: form.description.trim() || undefined,
      }).unwrap();
      toast.success("Department created successfully.");
      setIsCreateOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create department.");
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept) return;
    if (!form.name.trim()) {
      toast.error("Department name is required.");
      return;
    }

    try {
      await updateDept({
        id: editingDept.id,
        body: {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
        },
      }).unwrap();
      toast.success("Department updated successfully.");
      setEditingDept(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update department.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingDept) return;
    if (deletingDept._count?.users && deletingDept._count.users > 0) {
      toast.error(
        `Cannot delete department because ${deletingDept._count.users} user(s) are assigned to it.`
      );
      setDeletingDept(null);
      return;
    }

    try {
      await deleteDept(deletingDept.id).unwrap();
      toast.success("Department deleted successfully.");
      setDeletingDept(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete department.");
    }
  };

  const columns: Column<IDepartment>[] = [
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
      header: "Department Name",
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
      key: "members",
      header: "Members",
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="w-3.5 h-3.5 text-primary" />
          <span className="font-medium text-foreground">{item._count?.users || 0}</span>
          <span>users</span>
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
          <PermissionGate permissions={["department.update"]}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Edit Department"
              onClick={() => handleOpenEdit(item)}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          </PermissionGate>
          <PermissionGate permissions={["department.delete"]}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:bg-destructive/10"
              title="Delete Department"
              onClick={() => setDeletingDept(item)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </PermissionGate>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Academic Departments"
        description="Organize university faculties, administrative bodies, and departments for user segregation, equipment requisition routing, and custody tracking."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Administration", href: "/users" },
          { label: "Departments" },
        ]}
      >
        <PermissionGate permissions={["department.create"]}>
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="w-4 h-4" /> Add Department
          </Button>
        </PermissionGate>
      </PageHeader>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Departments
            </CardTitle>
            <Building className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active academic and admin branches
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Affiliated Personnel
            </CardTitle>
            <Users className="w-4 h-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Faculty members and staff users
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Institutional Divisions
            </CardTitle>
            <GraduationCap className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {departments.filter((d) => (d._count?.users || 0) > 0).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Departments with active custodians
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
              placeholder="Search departments by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Badge variant="secondary" className="text-xs shrink-0">
            {filteredDepts.length} {filteredDepts.length === 1 ? "Department" : "Departments"}
          </Badge>
        </div>

        <DataTable
          columns={columns}
          data={filteredDepts}
          isLoading={isLoading}
          emptyTitle="No departments found"
          emptyDescription="Create your first academic department above."
        />
      </Card>

      {/* Create Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader>
              <DialogTitle>Add New Department</DialogTitle>
              <DialogDescription>
                Define a new university department or division.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="code" className="text-xs font-semibold">
                  Department Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="code"
                  placeholder="e.g. CSE, EEE, ARCH"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="uppercase font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold">
                  Department Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g. Computer Science & Engineering"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="desc" className="text-xs font-semibold">
                  Description
                </Label>
                <Textarea
                  id="desc"
                  placeholder="Optional notes or department building location..."
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
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating...
                  </>
                ) : (
                  "Create Department"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editingDept} onOpenChange={(open) => !open && setEditingDept(null)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleUpdateSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Department</DialogTitle>
              <DialogDescription>
                Update details for {editingDept?.code}. Code cannot be modified after creation.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Department Code</Label>
                <Input value={editingDept?.code || ""} disabled className="bg-muted font-mono" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-name" className="text-xs font-semibold">
                  Department Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-desc" className="text-xs font-semibold">
                  Description
                </Label>
                <Textarea
                  id="edit-desc"
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
                onClick={() => setEditingDept(null)}
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
        isOpen={!!deletingDept}
        onClose={() => setDeletingDept(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Department"
        description={
          deletingDept?._count?.users && deletingDept._count.users > 0 ? (
            <span className="text-destructive font-medium flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              This department has {deletingDept._count.users} user(s) attached and cannot be deleted.
            </span>
          ) : (
            `Are you sure you want to delete "${deletingDept?.name}" (${deletingDept?.code})? This action cannot be undone.`
          )
        }
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        variant="destructive"
      />
    </div>
  );
}
