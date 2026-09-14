"use client";

import { useState } from "react";
import { Plus, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionHeader from "@/components/shared/SectionHeader";
import RoleTable from "@/components/roles/RoleTable";
import RoleModal from "@/components/roles/RoleModal";
import { useGetRolesQuery, useDeleteRoleMutation } from "@/redux/api/rbacApi";
import { usePermission } from "@/hooks/usePermission";
import { TRole } from "@/type";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function RolesPage() {
  const { can } = usePermission();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<TRole | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const { data, isLoading } = useGetRolesQuery();
  const [deleteRole, { isLoading: isDeleting }] = useDeleteRoleMutation();

  const roles = data?.data || [];
  const handleOpenCreate = () => {
    setSelectedRole(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (role: TRole) => {
    setSelectedRole(role);
    setModalOpen(true);
  };

  const handleOpenDelete = (id: string, name: string) => {
    setRoleToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!roleToDelete) return;
    try {
      await deleteRole(roleToDelete.id).unwrap();
      toast.success(`Role "${roleToDelete.name}" deleted successfully.`);
      setDeleteDialogOpen(false);
      setRoleToDelete(null);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete role");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <SectionHeader
          title="Roles & Access Control (RBAC)"
          description="Define institutional authority levels, assign security permissions, and protect sensitive inventory operations."
        />

        {can("role.create") && (
          <Button onClick={handleOpenCreate} className="shrink-0 gap-1.5 shadow-xs">
            <Plus className="size-4" />
            <span>Add New Role</span>
          </Button>
        )}
      </div>

      {/* Role Table */}
      <RoleTable
        roles={roles}
        isLoading={isLoading}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
      />

      {/* Role Modal */}
      <RoleModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        role={selectedRole}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Shield className="size-5" />
              Confirm Role Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the role{" "}
              <strong className="text-foreground">
                "{roleToDelete?.name}"
              </strong>
              ? Users assigned this role will lose its permissions.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Yes, Delete Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
