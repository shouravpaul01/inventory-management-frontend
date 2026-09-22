"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, FieldError } from "@/components/ui/field";
import { FormInput } from "@/components/shared/form/FormInput";
import { FormCheckbox } from "@/components/shared/form/FormCheckbox";
import SearchInput from "@/components/shared/SearchInput";
import FilterSelect from "@/components/shared/FilterSelect";
import RequirementTypeSelector from "./RequirementTypeSelector";
import TargetScopeSelector from "./TargetScopeSelector";
import {
  useCreatePolicyMutation,
  useUpdatePolicyMutation,
} from "@/redux/api/approvalApi";
import { useGetPermissionsQuery, useGetRolesQuery } from "@/redux/api/rbacApi";
import { useGetUsersQuery } from "@/redux/api/userApi";
import {
  approvalPolicySchema,
  TApprovalPolicyInput,
} from "@/validation/approval.validation";
import { TApprovalPolicy } from "@/type";
import { ShieldCheck, X, Check, Loader2, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";

interface ApprovalPolicyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policy?: TApprovalPolicy | null;
  existingPolicies?: TApprovalPolicy[];
}

export default function ApprovalPolicyModal({
  open,
  onOpenChange,
  policy,
  existingPolicies = [],
}: ApprovalPolicyModalProps) {
  const [createPolicy, { isLoading: isCreating }] = useCreatePolicyMutation();
  const [updatePolicy, { isLoading: isUpdating }] = useUpdatePolicyMutation();
  const isLoading = isCreating || isUpdating;
  const isEditing = Boolean(policy?.id);

  const { data: permsData, isLoading: isPermsLoading } = useGetPermissionsQuery(
    { limit: 300 },
  );
  const permissions = permsData?.data;

  const { data: rolesData } = useGetRolesQuery();
  const roles = rolesData?.data;

  const { data: usersData } = useGetUsersQuery({ limit: 100 });
  const users = usersData?.data;

  // Options for shared FormSelect
  const userOptions = useMemo(
    () =>
      (users || []).map((u) => ({
        value: u.id,
        label: `${u.firstName} ${u.lastName || ""} (${u.email}) - ${u.employeeId || "Staff"}`,
      })),
    [users],
  );

  const roleOptions = useMemo(
    () =>
      (roles || []).map((r) => ({
        value: r.id,
        label: `${r.name} (${r.code})`,
      })),
    [roles],
  );

  // Filter & Search states for permissions multi-select
  const [permissionSearch, setPermissionSearch] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");

  // React Hook Form initialization with FormProvider
  const methods = useForm<TApprovalPolicyInput>({
    resolver: zodResolver(approvalPolicySchema),
    defaultValues: {
      requirement: "NOT_REQUIRED",
      scope: "USER",
      userId: "",
      roleId: "",
      permissionCodes: [],
      approvalLevelCount: 1,
      allowSelfApproval: false,
    },
  });

  const {
    handleSubmit,
    setValue,
    getValues,
    reset,
    control,
    formState: { errors },
  } = methods;

  const requirement = useWatch({
    control,
    name: "requirement",
    defaultValue: "NOT_REQUIRED",
  });

  const scope = useWatch({
    control,
    name: "scope",
    defaultValue: "USER",
  });

  const selectedPermissionCodes =
    useWatch({
      control,
      name: "permissionCodes",
      defaultValue: [],
    }) || [];

  const selectedCodeSet = useMemo(
    () => new Set(selectedPermissionCodes),
    [selectedPermissionCodes],
  );

  useEffect(() => {
    if (!open) return;

    if (policy) {
      // Find all permissions currently associated with this exact target & requirement
      const targetPolicies = (existingPolicies || []).filter(
        (p) =>
          p.requirement === policy.requirement &&
          p.scope === policy.scope &&
          (policy.scope === "USER"
            ? p.userId && p.userId === policy.userId
            : p.roleId && p.roleId === policy.roleId),
      );

      const initialCodes =
        targetPolicies.length > 0
          ? Array.from(
              new Set(
                targetPolicies
                  .map((p) => p.permission?.code)
                  .filter((code): code is string => Boolean(code)),
              ),
            )
          : policy.permission?.code
            ? [policy.permission.code]
            : [];

      const finalInitialCodes =
        initialCodes.length > 0
          ? initialCodes
          : policy.permission?.code
            ? [policy.permission.code]
            : [];

      reset({
        requirement: policy.requirement,
        scope: policy.scope === "SYSTEM" ? "ROLE" : policy.scope,
        userId: policy.userId || "",
        roleId: policy.roleId || "",
        permissionCodes: finalInitialCodes,
        approvalLevelCount: policy.approvalLevelCount || 1,
        allowSelfApproval: policy.allowSelfApproval || false,
      });
      setPermissionSearch("");
      setSelectedCategoryFilter("ALL");
    } else {
      reset({
        requirement: "NOT_REQUIRED",
        scope: "USER",
        userId: "",
        roleId: "",
        permissionCodes: [],
        approvalLevelCount: 1,
        allowSelfApproval: false,
      });
      setPermissionSearch("");
      setSelectedCategoryFilter("ALL");
    }
  }, [open, policy, existingPolicies]);

  // Unique mutation permissions (exclude pure views and lookups)
  const mutationPermissions = useMemo(() => {
    if (!permissions) return [];
    const map = new Map<string, (typeof permissions)[0]>();
    for (const p of permissions) {
      if (!p.code.endsWith(".view") && !p.code.endsWith(".qr_lookup")) {
        if (!map.has(p.code)) {
          map.set(p.code, p);
        }
      }
    }
    return Array.from(map.values());
  }, [permissions]);

  const getCategoryOfPermission = (code: string) => {
    if (code.startsWith("requisition.")) return "REQUISITION";
    if (code.startsWith("inventory_item.") || code.startsWith("item."))
      return "INVENTORY_ITEM";
    if (code.startsWith("stock.")) return "STOCK";
    if (code.startsWith("category.")) return "CATEGORY";
    if (
      code.startsWith("department.") ||
      code.startsWith("building.") ||
      code.startsWith("location.")
    )
      return "ORGANIZATION";
    return "OTHER";
  };

  const filteredPermissions = useMemo(() => {
    return mutationPermissions.filter((p) => {
      if (
        selectedCategoryFilter !== "ALL" &&
        getCategoryOfPermission(p.code) !== selectedCategoryFilter
      ) {
        return false;
      }
      if (permissionSearch.trim()) {
        const term = permissionSearch.toLowerCase();
        return (
          p.name.toLowerCase().includes(term) ||
          p.code.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [mutationPermissions, selectedCategoryFilter, permissionSearch]);

  const togglePermission = (code: string) => {
    const current = getValues("permissionCodes") || [];
    const set = new Set(current);
    if (set.has(code)) {
      set.delete(code);
    } else {
      set.add(code);
    }

    setValue("permissionCodes", Array.from(set), {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleSelectAllFiltered = () => {
    const current = getValues("permissionCodes") || [];
    const set = new Set(current);
    filteredPermissions.forEach((p) => set.add(p.code));
    setValue("permissionCodes", Array.from(set), {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleDeselectAllFiltered = () => {
    const current = getValues("permissionCodes") || [];
    const filterSet = new Set(filteredPermissions.map((p) => p.code));
    const filtered = current.filter((code) => !filterSet.has(code));
    setValue("permissionCodes", filtered, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleRemoveSelected = (code: string) => {
    const current = getValues("permissionCodes") || [];
    const updated = current.filter((c) => c !== code);
    setValue("permissionCodes", updated, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const onSubmit = async (values: TApprovalPolicyInput) => {
    try {
      if (isEditing && policy) {
        await updatePolicy({
          id: policy.id,
          permissionCodes: values.permissionCodes,
          scope: values.scope,
          requirement: values.requirement,
          userId: values.scope === "USER" ? values.userId : null,
          roleId: values.scope === "ROLE" ? values.roleId : null,
          approvalLevelCount:
            values.requirement === "REQUIRED"
              ? Number(values.approvalLevelCount) || 1
              : 1,
          allowSelfApproval:
            values.requirement === "REQUIRED"
              ? Boolean(values.allowSelfApproval)
              : false,
        }).unwrap();

        toast.success(
          values.permissionCodes.length > 1
            ? `Updated policy across ${values.permissionCodes.length} action(s) successfully!`
            : "Approval policy / exemption updated successfully!",
        );
      } else {
        await createPolicy({
          permissionCodes: values.permissionCodes,
          scope: values.scope,
          requirement: values.requirement,
          userId: values.scope === "USER" ? values.userId : undefined,
          roleId: values.scope === "ROLE" ? values.roleId : undefined,
          approvalLevelCount:
            values.requirement === "REQUIRED"
              ? Number(values.approvalLevelCount) || 1
              : 1,
          allowSelfApproval:
            values.requirement === "REQUIRED"
              ? Boolean(values.allowSelfApproval)
              : false,
        }).unwrap();

        toast.success(
          values.requirement === "NOT_REQUIRED"
            ? `Exemption applied for ${values.permissionCodes.length} action(s)! Target can now perform these directly.`
            : `Approval policy applied for ${values.permissionCodes.length} action(s)! Strict review enabled.`,
        );
      }

      reset();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(
        err?.data?.message ||
          `Failed to ${isEditing ? "update" : "create"} approval policy`,
      );
    }
  };

  const allFilteredSelected =
    filteredPermissions.length > 0 &&
    filteredPermissions.every((p) => selectedCodeSet.has(p.code));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-5 pb-3 border-b bg-card shrink-0">
          <DialogTitle className="flex items-center gap-2 text-foreground font-bold">
            <ShieldCheck className="size-5 text-primary" />
            {isEditing
              ? "Edit Approval Policy / Exemption"
              : "Configure Approval Policy & Exemption"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {isEditing
              ? "Update rule configuration, target person or role, and selected actions."
              : "Configure institutional governance. Designate specific persons or roles to be exempted from Super Admin sign-off, or enforce multi-tier maker-checker verification."}
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...methods}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col flex-1 min-h-0 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* 1. Requirement Type (Policy Objective) */}
              <RequirementTypeSelector />

              {/* 2. Target Scope (Assignment Level) & Dynamic Target Selector */}
              <TargetScopeSelector
                userOptions={userOptions}
                roleOptions={roleOptions}
              />

              {/* 4. Target Action / Permissions */}
              <Field>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ListChecks className="size-4 text-primary" />
                    <span className="text-xs font-semibold text-foreground">
                      Target Actions / Permissions{" "}
                      <span className="text-destructive">*</span>
                    </span>
                    {selectedPermissionCodes.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-bold px-1.5 py-0"
                      >
                        {selectedPermissionCodes.length} selected
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={
                        allFilteredSelected
                          ? handleDeselectAllFiltered
                          : handleSelectAllFiltered
                      }
                      className="text-[11px] h-6 px-2 text-primary hover:text-primary cursor-pointer"
                    >
                      {allFilteredSelected
                        ? "Deselect Filtered"
                        : "Select All Filtered"}
                    </Button>
                    {selectedPermissionCodes.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() =>
                          setValue("permissionCodes", [], {
                            shouldValidate: true,
                            shouldDirty: true,
                          })
                        }
                        className="text-[11px] h-6 px-2 text-muted-foreground hover:text-destructive cursor-pointer"
                      >
                        Clear All
                      </Button>
                    )}
                  </div>
                </div>

                {/* Search & Category Filter Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-2 bg-muted p-3 rounded-md">
                  <div className="flex-1">
                    <SearchInput
                      placeholder="Search action by name or code (e.g. create, requisition, stock)..."
                      value={permissionSearch}
                      onChange={setPermissionSearch}
                    />
                  </div>

                  <div className="w-full sm:w-56">
                    <FilterSelect
                      placeholder="Filter by Category"
                      value={
                        selectedCategoryFilter === "ALL"
                          ? ""
                          : selectedCategoryFilter
                      }
                      onChange={(val) =>
                        setSelectedCategoryFilter(val || "ALL")
                      }
                      options={[
                        { label: "Requisitions", value: "REQUISITION" },
                        { label: "Inventory Items", value: "INVENTORY_ITEM" },
                        { label: "Stock Operations", value: "STOCK" },
                        { label: "Categories", value: "CATEGORY" },
                        {
                          label: "Departments & Locations",
                          value: "ORGANIZATION",
                        },
                      ]}
                      includeAllOption
                      allLabel="All Action Categories"
                    />
                  </div>
                </div>

                {/* Selected Chips View */}
                {selectedPermissionCodes.length > 0 && (
                  <div className="flex flex-wrap gap-1 p-2 mt-2 rounded-lg bg-muted/30 border ">
                    {selectedPermissionCodes.map((code) => {
                      const perm = mutationPermissions.find(
                        (p) => p.code === code,
                      );
                      return (
                        <span
                          key={code}
                          className="inline-flex items-center gap-1 text-[10px] font-medium bg-background border px-1.5 py-0.5 rounded shadow-2xs"
                        >
                          <span>{perm?.name || code}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSelected(code)}
                            className="text-muted-foreground hover:text-destructive cursor-pointer"
                          >
                            <X className="size-2.5" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Permissions Checkbox List Container */}
                <div className="rounded-lg border bg-card  divide-y mt-2 shadow-2xs">
                  {isPermsLoading ? (
                    <div className="p-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="size-4 animate-spin text-primary" />
                      <span>Loading actions and permissions...</span>
                    </div>
                  ) : filteredPermissions.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      No actions match your search or filter.
                    </div>
                  ) : (
                    filteredPermissions.map((perm) => {
                      const isChecked = selectedCodeSet.has(perm.code);
                      return (
                        <div
                          key={perm.code}
                          onClick={() => togglePermission(perm.code)}
                          className={cn(
                            "flex items-center justify-between p-2.5 cursor-pointer transition-colors text-xs select-none",
                            isChecked
                              ? "bg-primary/5 hover:bg-primary/10"
                              : "hover:bg-muted/40",
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={cn(
                                "size-4 shrink-0 rounded-[4px] border transition-colors flex items-center justify-center",
                                isChecked
                                  ? "bg-primary border-primary text-primary-foreground"
                                  : "border-input bg-background",
                              )}
                            >
                              {isChecked && (
                                <Check className="size-3 stroke-[3]" />
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-foreground">
                                {perm.name}
                              </div>
                              <div className="text-[10px] font-mono text-muted-foreground">
                                {perm.code}
                              </div>
                            </div>
                          </div>

                          <Badge
                            variant="outline"
                            className="text-[9px] font-mono shrink-0"
                          >
                            {getCategoryOfPermission(perm.code)}
                          </Badge>
                        </div>
                      );
                    })
                  )}
                </div>

                {errors.permissionCodes && (
                  <FieldError className="mt-1.5">
                    {errors.permissionCodes.message}
                  </FieldError>
                )}
              </Field>

              {/* 5. Levels & Self-Approval (if REQUIRED) */}
              {requirement === "REQUIRED" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t">
                  <FormInput
                    name="approvalLevelCount"
                    label="Approval Levels (Tiers)"
                    type="number"
                    placeholder="1"
                  />

                  <div className="pt-2">
                    <FormCheckbox
                      name="allowSelfApproval"
                      label="Allow Self-Approval"
                      description="Allow requester to approve their own request if they have reviewer permissions"
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="p-4 border-t bg-card shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset();
                  onOpenChange(false);
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isLoading ||
                  (!isEditing && selectedPermissionCodes.length === 0)
                }
                className="bg-primary cursor-pointer"
              >
                {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                {isEditing
                  ? "Update Policy Rule"
                  : selectedPermissionCodes.length > 1
                    ? `Save Rules (${selectedPermissionCodes.length} actions)`
                    : "Save Policy / Exemption"}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
