"use client";

import React, { useState, useMemo } from "react";
import {
  Shield,
  ShieldPlus,
  Edit2,
  Trash2,
  KeyRound,
  Users,
  Loader2,
  Save,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { PermissionGate } from "@/components/shared/permissions/PermissionGate";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useGetAllRolesQuery,
  useGetAllPermissionsQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useAssignRolePermissionsMutation,
} from "@/redux/api/rbacApi";
import { IRole } from "@/types";
import { toast } from "sonner";

export default function RolesPage() {
  const { data: rolesRes, isLoading: isRolesLoading, refetch: refetchRoles } = useGetAllRolesQuery();
  const { data: permsRes } = useGetAllPermissionsQuery();

  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();
  const [deleteRole, { isLoading: isDeleting }] = useDeleteRoleMutation();
  const [assignPermissions, { isLoading: isAssigning }] = useAssignRolePermissionsMutation();

  const roles = rolesRes?.data || [];
  const allPermissions = useMemo(() => permsRes?.data || [], [permsRes]);

  // Group all permissions by module
  const permissionsByModule = useMemo(() => {
    const map: Record<string, typeof allPermissions> = {};
    for (const p of allPermissions) {
      if (!map[p.module]) map[p.module] = [];
      map[p.module].push(p);
    }
    return map;
  }, [allPermissions]);

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newRole, setNewRole] = useState({ name: "", code: "", description: "" });

  // Edit Modal State
  const [editingRole, setEditingRole] = useState<IRole | null>(null);

  // Assign Permissions Modal State
  const [permRole, setPermRole] = useState<IRole | null>(null);
  const [selectedPermIds, setSelectedPermIds] = useState<string[]>([]);
  const [permSearch, setPermSearch] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRole.name || !newRole.code) {
      toast.error("Role name and unique code are required.");
      return;
    }

    try {
      await createRole({
        name: newRole.name.trim(),
        code: newRole.code.trim().toUpperCase(),
        description: newRole.description?.trim(),
      }).unwrap();
      toast.success("Role created successfully.");
      setIsCreateOpen(false);
      setNewRole({ name: "", code: "", description: "" });
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to create role.");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;

    try {
      await updateRole({
        id: editingRole.id,
        body: {
          name: editingRole.name,
          description: editingRole.description || undefined,
        },
      }).unwrap();
      toast.success("Role details updated successfully.");
      setEditingRole(null);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update role.");
    }
  };

  const handleDelete = async (roleId: string) => {
    try {
      await deleteRole(roleId).unwrap();
      toast.success("Role removed successfully.");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete role.");
    }
  };

  const openPermissionsModal = (role: IRole) => {
    setPermRole(role);
    const existing = role.permissions?.map((p) => p.permissionId) || [];
    setSelectedPermIds(existing);
    setPermSearch("");
  };

  const handleSavePermissions = async () => {
    if (!permRole) return;

    try {
      await assignPermissions({
        id: permRole.id,
        permissionIds: selectedPermIds,
      }).unwrap();
      toast.success(`Permissions updated for role ${permRole.name}.`);
      setPermRole(null);
      refetchRoles();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to save permissions.");
    }
  };

  const toggleModulePermissions = (modulePerms: typeof allPermissions) => {
    const moduleIds = modulePerms.map((p) => p.id);
    const allSelected = moduleIds.every((id) => selectedPermIds.includes(id));

    if (allSelected) {
      setSelectedPermIds(selectedPermIds.filter((id) => !moduleIds.includes(id)));
    } else {
      const merged = new Set([...selectedPermIds, ...moduleIds]);
      setSelectedPermIds(Array.from(merged));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Role-Based Access Control (RBAC)"
        description="Configure departmental role definitions and map permissions to govern administrative and staff access levels."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Administration" },
          { label: "Roles" },
        ]}
      >
        <PermissionGate permission="role.create">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 gap-1.5 text-xs font-semibold">
                <ShieldPlus className="size-3.5" />
                <span>Create Role</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Define Department Role</DialogTitle>
                <DialogDescription>
                  Specify role identification parameters. Permissions can be attached immediately after creation.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreate} className="space-y-4 py-2 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Role Name *</label>
                  <Input
                    required
                    placeholder="e.g. Store Keeper, Lab Assistant"
                    value={newRole.name}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Role Code *</label>
                  <Input
                    required
                    placeholder="e.g. STORE_KEEPER"
                    value={newRole.code}
                    onChange={(e) => setNewRole({ ...newRole, code: e.target.value.toUpperCase() })}
                    className="text-xs h-9 font-mono uppercase"
                  />
                  <span className="text-[10px] text-muted-foreground">Unique identifier used by security policies</span>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Description</label>
                  <Textarea
                    placeholder="Describe the operational responsibilities of this role..."
                    value={newRole.description}
                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                    className="text-xs"
                    rows={3}
                  />
                </div>

                <DialogFooter className="pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreateOpen(false)}
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={isCreating}>
                    {isCreating ? "Saving..." : "Create Role"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </PermissionGate>
      </PageHeader>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isRolesLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4 shadow-2xs">
              <div className="space-y-2">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-8 w-full mt-4" />
              </div>
            </Card>
          ))
        ) : roles.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground text-xs">
            No roles configured. Create your first department role above.
          </div>
        ) : (
          roles.map((role) => (
            <Card key={role.id} className="shadow-2xs border flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-1.5">
                      <Shield className="size-4 text-primary shrink-0" />
                      <span>{role.name}</span>
                    </CardTitle>
                    <span className="text-[11px] font-mono text-muted-foreground block mt-0.5">
                      {role.code}
                    </span>
                  </div>

                  {role.isSystemRole && (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px]">
                      System Role
                    </Badge>
                  )}
                </div>

                <CardDescription className="text-xs mt-2 line-clamp-2">
                  {role.description || "No operational description provided."}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-2 border-t">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <KeyRound className="size-3.5" />
                    <span>{role.permissions?.length || 0} permissions</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="size-3.5" />
                    <span>{role._count?.users || 0} assigned user(s)</span>
                  </span>
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-1">
                  <PermissionGate permission="role.update">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openPermissionsModal(role)}
                      className="h-8 text-xs gap-1"
                    >
                      <KeyRound className="size-3" />
                      <span>Permissions</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setEditingRole(role)}
                      className="size-8"
                      title="Edit role"
                    >
                      <Edit2 className="size-3.5" />
                    </Button>
                  </PermissionGate>

                  {!role.isSystemRole && (
                    <PermissionGate permission="role.delete">
                      <ConfirmDialog
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="size-8 text-destructive hover:bg-destructive/10"
                            title="Delete role"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        }
                        title={`Delete Role: ${role.name}?`}
                        description="Deleting this role will revoke it from all assigned users immediately. This action is recorded in audit logs."
                        confirmText="Delete Role"
                        variant="destructive"
                        onConfirm={() => handleDelete(role.id)}
                        isLoading={isDeleting}
                      />
                    </PermissionGate>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Role Dialog */}
      {editingRole && (
        <Dialog open={!!editingRole} onOpenChange={(open) => !open && setEditingRole(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Role: {editingRole.name}</DialogTitle>
              <DialogDescription>Update the descriptive parameters for this role.</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleUpdate} className="space-y-4 py-2 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Role Name</label>
                <Input
                  value={editingRole.name}
                  onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Description</label>
                <Textarea
                  value={editingRole.description || ""}
                  onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                  className="text-xs"
                  rows={3}
                />
              </div>

              <DialogFooter className="pt-3">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditingRole(null)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isUpdating}>
                  {isUpdating ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Assign Permissions Modal */}
      {permRole && (
        <Dialog open={!!permRole} onOpenChange={(open) => !open && setPermRole(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0">
            <DialogHeader className="p-6 pb-3 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-base font-bold">
                    Assign Role Permissions: {permRole.name}
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Checked capabilities will be automatically granted to every user possessing this role.
                  </DialogDescription>
                </div>
                <Badge variant="outline" className="text-xs font-mono font-semibold">
                  {selectedPermIds.length} / {allPermissions.length} selected
                </Badge>
              </div>

              <div className="pt-3">
                <Input
                  type="search"
                  placeholder="Filter permissions by code or description..."
                  value={permSearch}
                  onChange={(e) => setPermSearch(e.target.value)}
                  className="text-xs h-8 bg-background"
                />
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {Object.entries(permissionsByModule).map(([moduleName, perms]) => {
                const filtered = perms.filter(
                  (p) =>
                    p.code.toLowerCase().includes(permSearch.toLowerCase()) ||
                    p.name.toLowerCase().includes(permSearch.toLowerCase())
                );

                if (filtered.length === 0) return null;

                const allModuleSelected = filtered.every((p) => selectedPermIds.includes(p.id));

                return (
                  <div key={moduleName} className="space-y-2 rounded-xl border p-3.5 bg-muted/10">
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="font-bold text-xs uppercase tracking-wider text-foreground">
                        {moduleName} Module ({filtered.length})
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleModulePermissions(filtered)}
                        className="h-6 text-[11px] text-primary"
                      >
                        {allModuleSelected ? "Deselect All" : "Select All"}
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {filtered.map((p) => {
                        const isChecked = selectedPermIds.includes(p.id);
                        return (
                          <label
                            key={p.id}
                            className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer select-none transition-colors ${
                              isChecked
                                ? "bg-primary/5 border-primary/40 font-medium"
                                : "hover:bg-muted/30"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedPermIds([...selectedPermIds, p.id]);
                                } else {
                                  setSelectedPermIds(selectedPermIds.filter((id) => id !== p.id));
                                }
                              }}
                              className="rounded border-input text-primary focus:ring-primary size-3.5 mt-0.5"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="font-mono text-[11px] truncate text-foreground">{p.code}</div>
                              <div className="text-[10px] text-muted-foreground truncate">{p.name}</div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <DialogFooter className="p-4 border-t bg-muted/20">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPermRole(null)}
                disabled={isAssigning}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSavePermissions}
                disabled={isAssigning}
                className="gap-1.5"
              >
                {isAssigning ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin mr-1" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="size-3.5" />
                    <span>Save Permissions</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
