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
import { FormSelect } from "@/components/shared/form/FormSelect";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  useCreateUserMutation,
  useUpdateUserMutation,
  useAssignUserRolesMutation,
} from "@/redux/api/userApi";
import { useGetDepartmentsQuery } from "@/redux/api/departmentApi";
import { useGetRolesQuery } from "@/redux/api/rbacApi";
import {
  createUserSchema,
  updateUserSchema,
  TCreateUserInput,
} from "@/validation/user.validation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { TUser } from "@/type";

interface UserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: TUser | null;
}

export default function UserModal({
  open,
  onOpenChange,
  user,
}: UserModalProps) {
  const isEdit = Boolean(user);

  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  const { data: deptData } = useGetDepartmentsQuery({ limit: 100 });
  const { data: rolesData } = useGetRolesQuery();

  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [assignUserRoles, { isLoading: isAssigningRoles }] =
    useAssignUserRolesMutation();

  const isLoading = isCreating || isUpdating || isAssigningRoles;

  const departmentOptions = (deptData?.data || []).map((d) => ({
    value: d.id,
    label: `${d.name} (${d.code})`,
  }));

  const roles = rolesData?.data || [];

  const methods = useForm<any>({
    resolver: zodResolver(isEdit ? updateUserSchema : createUserSchema),
    defaultValues: {
      employeeId: "",
      username: "",
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      departmentId: "",
      password: "",
    },
  });

  const { reset } = methods;

  useEffect(() => {
    if (!open) return;

    if (user) {
      reset({
        employeeId: user.employeeId,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName || "",
        phone: user.phone || "",
        departmentId: user.departmentId || "",
      });

      const currentRoleIds = Array.isArray(user.roles)
        ? user.roles.map((r: any) =>
            typeof r === "string" ? r : r.roleId || r.role?.id
          )
        : [];
      setSelectedRoleIds(currentRoleIds.filter(Boolean));
    } else {
      reset({
        employeeId: "",
        username: "",
        email: "",
        firstName: "",
        lastName: "",
        phone: "",
        departmentId: "",
        password: "",
      });
      setSelectedRoleIds([]);
    }
  }, [open, user?.id, reset]);

  const onSubmit = async (data: any) => {
    try {
      if (isEdit && user) {
        await updateUser({
          id: user.id,
          body: {
            firstName: data.firstName.trim(),
            lastName: data.lastName?.trim() || undefined,
            phone: data.phone?.trim() || undefined,
            departmentId: data.departmentId,
          },
        }).unwrap();

        if (selectedRoleIds.length > 0) {
          await assignUserRoles({
            id: user.id,
            roleIds: selectedRoleIds,
          }).unwrap();
        }

        toast.success("User account updated successfully 🎉");
      } else {
        await createUser({
          employeeId: data.employeeId.trim(),
          username: data.username.trim().toLowerCase(),
          email: data.email.trim(),
          firstName: data.firstName.trim(),
          lastName: data.lastName?.trim() || undefined,
          phone: data.phone?.trim() || undefined,
          departmentId: data.departmentId,
          password: data.password,
          roleIds: selectedRoleIds,
        }).unwrap();

        toast.success("User account created successfully 🎉");
      }
      onOpenChange(false);
      methods.reset();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to save user");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Staff Account" : "Register Institutional Staff"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update personnel information, departmental affiliation, and assigned roles."
              : "Provision a new university faculty, administrator, or storekeeper user."}
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormInput
                name="firstName"
                label="First Name"
                placeholder="e.g. John"
                disabled={isLoading}
              />
              <FormInput
                name="lastName"
                label="Last Name"
                placeholder="e.g. Doe"
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormInput
                name="employeeId"
                label="Employee ID / Faculty ID"
                placeholder="e.g. EMP-1042"
                disabled={isLoading || isEdit}
              />
              <FormInput
                name="username"
                label="Username"
                placeholder="e.g. jdoe"
                disabled={isLoading || isEdit}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormInput
                name="email"
                label="Institutional Email"
                type="email"
                placeholder="e.g. jdoe@uni.edu"
                disabled={isLoading || isEdit}
              />
              <FormInput
                name="phone"
                label="Contact Phone (Optional)"
                placeholder="e.g. +1 555-0199"
                disabled={isLoading}
              />
            </div>

            <FormSelect
              name="departmentId"
              label="Assigned Department"
              placeholder="Select Department"
              options={departmentOptions}
              disabled={isLoading}
            />

            {!isEdit && (
              <FormInput
                name="password"
                label="Initial Password"
                type="password"
                placeholder="Min. 6 characters"
                disabled={isLoading}
              />
            )}

            {/* Role Assignments Checkboxes */}
            <div className="space-y-2 pt-1 border-t border-border/60">
              <label className="text-xs font-semibold text-foreground">
                Assign System Roles
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1 rounded-md border border-input/60 bg-muted/20">
                {roles.map((role) => (
                  <label
                    key={role.id}
                    htmlFor={`role-${role.id}`}
                    className="flex items-center space-x-2 p-1.5 rounded hover:bg-muted/50 cursor-pointer select-none"
                  >
                    <Checkbox
                      id={`role-${role.id}`}
                      checked={selectedRoleIds.includes(role.id)}
                      onCheckedChange={(checked) => {
                        setSelectedRoleIds((prev) =>
                          checked
                            ? [...prev.filter((id) => id !== role.id), role.id]
                            : prev.filter((id) => id !== role.id)
                        );
                      }}
                    />
                    <span className="text-xs font-medium cursor-pointer">
                      {role.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-2">
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
                  "Create Staff User"
                )}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
