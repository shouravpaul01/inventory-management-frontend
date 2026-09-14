"use client";

import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/shared/form/FormInput";
import { FormTextarea } from "@/components/shared/form/FormTextarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useAssignRolePermissionsMutation,
  useGetPermissionsQuery,
} from "@/redux/api/rbacApi";
import { roleFormSchema, TRoleFormInput } from "@/validation/rbac.validation";
import { toast } from "sonner";
import { Loader2, Shield } from "lucide-react";
import { TRole } from "@/type";

interface RoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: TRole | null;
}

export default function RoleModal({
  open,
  onOpenChange,
  role,
}: RoleModalProps) {
  const isEdit = Boolean(role);

  const { data: permsData } = useGetPermissionsQuery();
  const permissions = permsData?.data || [];

  const [selectedPermIds, setSelectedPermIds] = useState<string[]>([]);

  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();
  const [assignRolePermissions, { isLoading: isAssigning }] =
    useAssignRolePermissionsMutation();

  const isLoading = isCreating || isUpdating || isAssigning;

  const methods = useForm<TRoleFormInput>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
    },
  });

  const { reset } = methods;

  useEffect(() => {
    if (!open) return;

    if (role) {
      reset({
        name: role.name,
        code: role.code,
        description: role.description || "",
      });

      const currentPermIds = Array.isArray(role.permissions)
        ? role.permissions.map((rp: any) =>
            typeof rp === "string" ? rp : rp.permissionId || rp.permission?.id
          )
        : [];
      setSelectedPermIds(currentPermIds.filter(Boolean));
    } else {
      reset({
        name: "",
        code: "",
        description: "",
      });
      setSelectedPermIds([]);
    }
  }, [role?.id, open, reset]);

  // Group permissions by module
  const modules = Array.from(new Set(permissions.map((p) => p.module))).sort();

  const togglePerm = (id: string) => {
    setSelectedPermIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleModuleAll = (moduleName: string) => {
    const modulePermIds = permissions
      .filter((p) => p.module === moduleName)
      .map((p) => p.id);

    const allSelected = modulePermIds.every((id) =>
      selectedPermIds.includes(id)
    );

    if (allSelected) {
      setSelectedPermIds((prev) =>
        prev.filter((id) => !modulePermIds.includes(id))
      );
    } else {
      setSelectedPermIds((prev) =>
        Array.from(new Set([...prev, ...modulePermIds]))
      );
    }
  };

  const onSubmit = async (data: TRoleFormInput) => {
    try {
      if (isEdit && role) {
        await updateRole({
          id: role.id,
          body: {
            name: data.name.trim(),
            description: data.description?.trim(),
          },
        }).unwrap();

        await assignRolePermissions({
          id: role.id,
          permissionIds: selectedPermIds,
        }).unwrap();

        toast.success("Role permissions updated successfully 🎉");
      } else {
        await createRole({
          name: data.name.trim(),
          code: data.code.trim().toUpperCase(),
          description: data.description?.trim(),
          permissionIds: selectedPermIds,
        }).unwrap();

        toast.success("Role created successfully 🎉");
      }
      onOpenChange(false);
      methods.reset();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to save role");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[88vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="size-5 text-primary" />
            {isEdit ? "Edit Role & Permissions" : "Define New System Role"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modify capabilities assigned to staff members holding this role."
              : "Create a security role and assign granular module permissions."}
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit(onSubmit)}
            className="space-y-4 flex-1 overflow-hidden flex flex-col"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
              <FormInput
                name="name"
                label="Role Name"
                placeholder="e.g. Department Storekeeper"
                disabled={isLoading}
              />
              <FormInput
                name="code"
                label="Role Code"
                placeholder="e.g. STORE_KEEPER"
                disabled={isLoading || isEdit}
              />
            </div>

            <FormTextarea
              name="description"
              label="Role Description (Optional)"
              placeholder="Scope of responsibilities and custody boundaries"
              disabled={isLoading}
              rows={2}
              className="shrink-0"
            />

            {/* Permissions Matrix */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 border-t border-border/60 pt-3">
              <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10 pb-1">
                <span className="text-xs font-semibold text-foreground">
                  Module Permissions ({selectedPermIds.length} selected)
                </span>
              </div>

              {modules.map((moduleName) => {
                const modulePerms = permissions.filter(
                  (p) => p.module === moduleName
                );
                const isAllSelected = modulePerms.every((p) =>
                  selectedPermIds.includes(p.id)
                );

                return (
                  <div
                    key={moduleName}
                    className="rounded-lg border border-border/70 p-3 space-y-2 bg-card/60"
                  >
                    <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {moduleName} Module
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleModuleAll(moduleName)}
                        className="text-[11px] text-primary hover:underline font-medium"
                      >
                        {isAllSelected ? "Deselect All" : "Select All"}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {modulePerms.map((perm) => (
                        <div
                          key={perm.id}
                          className="flex items-start space-x-2 p-1.5 rounded hover:bg-muted/50 cursor-pointer"
                          onClick={() => togglePerm(perm.id)}
                        >
                          <Checkbox
                            id={`perm-${perm.id}`}
                            checked={selectedPermIds.includes(perm.id)}
                            onCheckedChange={() => togglePerm(perm.id)}
                            className="mt-0.5"
                          />
                          <div className="flex flex-col text-left leading-tight">
                            <label
                              htmlFor={`perm-${perm.id}`}
                              className="text-xs font-medium text-foreground cursor-pointer"
                            >
                              {perm.name}
                            </label>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {perm.code}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <DialogFooter className="pt-2 border-t border-border/60 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Saving...
                  </>
                ) : isEdit ? (
                  "Save Changes"
                ) : (
                  "Create Role"
                )}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
