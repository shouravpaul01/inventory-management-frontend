"use client";

import React, { useState, use, useMemo } from "react";
import Link from "next/link";
import {
  Shield,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  PlusCircle,
  MinusCircle,
  PackageCheck,
  QrCode,
  Save,
  Loader2,
  Sliders,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PermissionGate } from "@/components/shared/permissions/PermissionGate";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetUserByIdQuery,
  useAssignUserRolesMutation,
  useOverrideUserPermissionsMutation,
} from "@/redux/api/usersApi";
import { useGetAllRolesQuery, useGetAllPermissionsQuery } from "@/redux/api/rbacApi";
import { useGetUserAssignedAssetsQuery } from "@/redux/api/reportsApi";
import { toast } from "sonner";

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const userId = resolvedParams.id;

  const { data: userRes, isLoading: isUserLoading, refetch: refetchUser } = useGetUserByIdQuery(userId);
  const { data: rolesRes } = useGetAllRolesQuery();
  const { data: permsRes } = useGetAllPermissionsQuery();
  const { data: assetsRes, isLoading: isAssetsLoading } = useGetUserAssignedAssetsQuery({ userId });

  const [assignRoles, { isLoading: isAssigningRoles }] = useAssignUserRolesMutation();
  const [overridePermissions, { isLoading: isSavingOverrides }] = useOverrideUserPermissionsMutation();

  const user = userRes?.data;
  const allRoles = useMemo(() => rolesRes?.data || [], [rolesRes]);
  const allPermissions = useMemo(() => permsRes?.data || [], [permsRes]);
  const assignedAssets = assetsRes?.data || [];

  // Local state for Role selection
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[] | null>(null);

  // Local state for Permission overrides: map of permissionId -> "GRANT" | "REVOKE" | "INHERIT"
  const [overrideMap, setOverrideMap] = useState<Record<string, "GRANT" | "REVOKE" | "INHERIT">>({});
  const [permSearch, setPermSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("ALL");

  // Sync role selection when user data loads
  const currentRoleIds = useMemo(() => {
    return user?.roles?.map((ur) => ur.roleId) || [];
  }, [user]);

  const activeRoleIds = selectedRoleIds !== null ? selectedRoleIds : currentRoleIds;

  // Set of permission IDs provided by the user's currently selected roles
  const rolePermissionIds = useMemo(() => {
    const ids = new Set<string>();
    const rolesMap = new Map(allRoles.map((r) => [r.id, r]));

    for (const rId of activeRoleIds) {
      const r = rolesMap.get(rId);
      if (r?.permissions) {
        for (const rp of r.permissions) {
          ids.add(rp.permissionId);
        }
      }
    }
    return ids;
  }, [allRoles, activeRoleIds]);

  // Initial overrides map from user object
  const initialOverrideMap = useMemo(() => {
    const map: Record<string, "GRANT" | "REVOKE" | "INHERIT"> = {};
    if (user?.permissions) {
      for (const override of user.permissions) {
        map[override.permissionId] = override.effect;
      }
    }
    return map;
  }, [user]);

  const currentOverrideMap = { ...initialOverrideMap, ...overrideMap };

  // Calculate effective status for a permission
  const getEffectiveState = (permId: string) => {
    if (user?.isSuperAdmin) return { allowed: true, reason: "SUPER_ADMIN" };

    const override = currentOverrideMap[permId];
    if (override === "GRANT") return { allowed: true, reason: "OVERRIDE_GRANT" };
    if (override === "REVOKE") return { allowed: false, reason: "OVERRIDE_REVOKE" };

    const fromRole = rolePermissionIds.has(permId);
    if (fromRole) return { allowed: true, reason: "ROLE_INHERITED" };

    return { allowed: false, reason: "NOT_GRANTED" };
  };

  const handleSaveRoles = async () => {
    try {
      await assignRoles({ id: userId, roleIds: activeRoleIds }).unwrap();
      toast.success("User roles updated successfully.");
      setSelectedRoleIds(null);
      refetchUser();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update roles.");
    }
  };

  const handleSaveOverrides = async () => {
    try {
      const overridesToSubmit: Array<{ permissionId: string; effect: "GRANT" | "REVOKE" }> = [];

      for (const [pId, effect] of Object.entries(currentOverrideMap)) {
        if (effect === "GRANT" || effect === "REVOKE") {
          overridesToSubmit.push({ permissionId: pId, effect });
        }
      }

      await overridePermissions({ id: userId, overrides: overridesToSubmit }).unwrap();
      toast.success("User permission overrides synchronized successfully.");
      setOverrideMap({});
      refetchUser();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to save permission overrides.");
    }
  };

  // Modules list for filtering permissions
  const modules = useMemo(() => {
    const set = new Set<string>();
    allPermissions.forEach((p) => set.add(p.module));
    return Array.from(set).sort();
  }, [allPermissions]);

  const filteredPermissions = useMemo(() => {
    return allPermissions.filter((p) => {
      const matchesSearch =
        p.code.toLowerCase().includes(permSearch.toLowerCase()) ||
        p.name.toLowerCase().includes(permSearch.toLowerCase()) ||
        p.module.toLowerCase().includes(permSearch.toLowerCase());

      const matchesModule = moduleFilter === "ALL" || p.module === moduleFilter;
      return matchesSearch && matchesModule;
    });
  }, [allPermissions, permSearch, moduleFilter]);

  if (isUserLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-xl font-bold text-foreground">User Record Not Found</h2>
        <p className="text-xs text-muted-foreground">The requested personnel account does not exist or has been removed.</p>
        <Button asChild variant="outline">
          <Link href="/users">Return to Users Directory</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={`${user.firstName} ${user.lastName || ""}`}
        description={`Employee ID: ${user.employeeId} • @${user.username} • ${user.department?.name || "Department"}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Users", href: "/users" },
          { label: user.username },
        ]}
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="h-9 gap-1.5 text-xs">
            <Link href="/users">
              <ArrowLeft className="size-3.5" />
              <span>Back to Users</span>
            </Link>
          </Button>

          <StatusBadge status={user.status} />
        </div>
      </PageHeader>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 shadow-2xs border">
          <div className="text-xs text-muted-foreground">Assigned Roles</div>
          <div className="text-xl font-bold mt-1 text-foreground">
            {user.roles?.length || 0}
          </div>
          <div className="text-[10px] text-muted-foreground truncate">
            {user.roles?.map((r) => r.role?.name).join(", ") || "No roles"}
          </div>
        </Card>

        <Card className="p-4 shadow-2xs border">
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            Explicit Grants (+)
          </div>
          <div className="text-xl font-bold mt-1 text-foreground">
            {Object.values(currentOverrideMap).filter((e) => e === "GRANT").length}
          </div>
          <div className="text-[10px] text-muted-foreground">Extra user capabilities</div>
        </Card>

        <Card className="p-4 shadow-2xs border">
          <div className="text-xs text-rose-600 dark:text-rose-400 font-medium">
            Explicit Revokes (-)
          </div>
          <div className="text-xl font-bold mt-1 text-foreground">
            {Object.values(currentOverrideMap).filter((e) => e === "REVOKE").length}
          </div>
          <div className="text-[10px] text-muted-foreground">Revoked role capabilities</div>
        </Card>

        <Card className="p-4 shadow-2xs border">
          <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
            Issued Assets
          </div>
          <div className="text-xl font-bold mt-1 text-foreground">
            {assignedAssets.length}
          </div>
          <div className="text-[10px] text-muted-foreground">Serialized items held</div>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="permissions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="permissions" className="text-xs gap-1.5">
            <Sliders className="size-3.5" />
            <span>Permissions</span>
          </TabsTrigger>
          <TabsTrigger value="roles" className="text-xs gap-1.5">
            <Shield className="size-3.5" />
            <span>Roles</span>
          </TabsTrigger>
          <TabsTrigger value="assets" className="text-xs gap-1.5">
            <PackageCheck className="size-3.5" />
            <span>Assets ({assignedAssets.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* 1. Permissions Overrides Tab */}
        <TabsContent value="permissions" className="space-y-4">
          <Card className="shadow-2xs border">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold">
                    Effective Permissions & User Overrides
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Configure granular GRANT or REVOKE overrides. Overrides take precedence over role permissions.
                  </CardDescription>
                </div>

                <PermissionGate permission="user.override_permission">
                  <Button
                    size="sm"
                    onClick={handleSaveOverrides}
                    disabled={isSavingOverrides}
                    className="h-9 gap-1.5 text-xs font-semibold shrink-0"
                  >
                    {isSavingOverrides ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin mr-1" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="size-3.5" />
                        <span>Save Overrides</span>
                      </>
                    )}
                  </Button>
                </PermissionGate>
              </div>

              {/* Formula explanation banner */}
              <div className="mt-3 p-3 rounded-xl bg-muted/40 border text-xs text-muted-foreground grid grid-cols-1 sm:grid-cols-4 gap-2 text-center sm:text-left">
                <div>
                  <span className="font-semibold text-foreground">Role Permissions</span>
                  <div className="text-[11px]">{rolePermissionIds.size} capabilities from assigned roles</div>
                </div>
                <div>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">+ Extra Grants</span>
                  <div className="text-[11px]">User overrides granting access</div>
                </div>
                <div>
                  <span className="font-semibold text-rose-600 dark:text-rose-400">- Explicit Revokes</span>
                  <div className="text-[11px]">User overrides denying access</div>
                </div>
                <div>
                  <span className="font-semibold text-foreground">= Effective Status</span>
                  <div className="text-[11px]">Final active authorization</div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Search and Module Filter */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="search"
                  placeholder="Search permissions by code, name, or module..."
                  value={permSearch}
                  onChange={(e) => setPermSearch(e.target.value)}
                  className="text-xs h-9 flex-1 bg-background"
                />

                <select
                  value={moduleFilter}
                  onChange={(e) => setModuleFilter(e.target.value)}
                  aria-label="Filter permissions by module"
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground focus:outline-hidden"
                >
                  <option value="ALL">All Modules ({allPermissions.length})</option>
                  {modules.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Permissions Table */}
              <div className="rounded-xl border overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-muted/40 border-b">
                    <tr>
                      <th className="p-3 font-semibold text-muted-foreground uppercase tracking-wider">
                        Permission / Module
                      </th>
                      <th className="p-3 font-semibold text-muted-foreground uppercase tracking-wider">
                        Role Inherited
                      </th>
                      <th className="p-3 font-semibold text-muted-foreground uppercase tracking-wider">
                        User Override
                      </th>
                      <th className="p-3 font-semibold text-muted-foreground uppercase tracking-wider text-right">
                        Effective Access
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredPermissions.map((perm) => {
                      const fromRole = rolePermissionIds.has(perm.id);
                      const currentOverride = currentOverrideMap[perm.id] || "INHERIT";
                      const effective = getEffectiveState(perm.id);

                      return (
                        <tr key={perm.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3">
                            <div className="font-mono font-semibold text-foreground">{perm.code}</div>
                            <div className="text-[11px] text-muted-foreground">{perm.name}</div>
                            <span className="text-[10px] text-muted-foreground/70 uppercase">
                              Module: {perm.module}
                            </span>
                          </td>

                          <td className="p-3">
                            {fromRole ? (
                              <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 text-[10px]">
                                Granted by Role
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-[11px]">None</span>
                            )}
                          </td>

                          <td className="p-3">
                            <div className="inline-flex rounded-lg border p-0.5 bg-muted/20">
                              <button
                                type="button"
                                onClick={() =>
                                  setOverrideMap({ ...overrideMap, [perm.id]: "INHERIT" })
                                }
                                className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                                  currentOverride === "INHERIT"
                                    ? "bg-background shadow-2xs font-semibold text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                Inherit
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setOverrideMap({ ...overrideMap, [perm.id]: "GRANT" })
                                }
                                className={`px-2 py-1 rounded text-[10px] font-medium transition-colors flex items-center gap-1 ${
                                  currentOverride === "GRANT"
                                    ? "bg-emerald-500 text-white font-semibold"
                                    : "text-muted-foreground hover:text-emerald-600"
                                }`}
                              >
                                <PlusCircle className="size-3" />
                                Grant
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setOverrideMap({ ...overrideMap, [perm.id]: "REVOKE" })
                                }
                                className={`px-2 py-1 rounded text-[10px] font-medium transition-colors flex items-center gap-1 ${
                                  currentOverride === "REVOKE"
                                    ? "bg-rose-500 text-white font-semibold"
                                    : "text-muted-foreground hover:text-rose-600"
                                }`}
                              >
                                <MinusCircle className="size-3" />
                                Revoke
                              </button>
                            </div>
                          </td>

                          <td className="p-3 text-right">
                            {effective.allowed ? (
                              <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1 text-[11px]">
                                <CheckCircle2 className="size-3" />
                                Allowed ({effective.reason})
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30 gap-1 text-[11px]">
                                <XCircle className="size-3" />
                                Denied
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. Roles Assignment Tab */}
        <TabsContent value="roles" className="space-y-4">
          <Card className="shadow-2xs border">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold">Assigned Department Roles</CardTitle>
                  <CardDescription className="text-xs">
                    Assigning a role grants the user all permissions associated with that role.
                  </CardDescription>
                </div>

                <PermissionGate permission="user.manage_roles">
                  <Button
                    size="sm"
                    onClick={handleSaveRoles}
                    disabled={isAssigningRoles}
                    className="h-9 gap-1.5 text-xs font-semibold shrink-0"
                  >
                    {isAssigningRoles ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin mr-1" />
                        Updating Roles...
                      </>
                    ) : (
                      <>
                        <Save className="size-3.5" />
                        <span>Save Roles</span>
                      </>
                    )}
                  </Button>
                </PermissionGate>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {allRoles.map((role) => {
                  const isAssigned = activeRoleIds.includes(role.id);
                  return (
                    <label
                      key={role.id}
                      className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                        isAssigned
                          ? "bg-primary/5 border-primary/40 shadow-xs"
                          : "hover:bg-muted/30"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isAssigned}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRoleIds([...activeRoleIds, role.id]);
                          } else {
                            setSelectedRoleIds(activeRoleIds.filter((id) => id !== role.id));
                          }
                        }}
                        className="rounded border-input text-primary focus:ring-primary size-4 mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-xs text-foreground flex items-center justify-between">
                          <span className="truncate">{role.name}</span>
                          {role.isSystemRole && (
                            <Badge variant="outline" className="text-[10px] ml-1">
                              System
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                          {role.description || `Role code: ${role.code}`}
                        </p>
                        <div className="text-[10px] text-primary font-mono mt-1">
                          {role.permissions?.length || 0} permission(s)
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. Assigned Assets Tab */}
        <TabsContent value="assets" className="space-y-4">
          <Card className="shadow-2xs border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Assigned Physical Equipment</CardTitle>
              <CardDescription className="text-xs">
                Serialized units currently in this user&apos;s possession.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isAssetsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : assignedAssets.length === 0 ? (
                <div className="text-center py-10 text-xs text-muted-foreground">
                  This user currently holds no issued serialized equipment.
                </div>
              ) : (
                <div className="space-y-2">
                  {assignedAssets.map((unit) => (
                    <div
                      key={unit.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-foreground">
                          {unit.inventoryItem?.name}
                        </div>
                        <div className="text-muted-foreground font-mono text-[11px]">
                          Code: {unit.uniqueCode} {unit.serialNumber && `• Serial: ${unit.serialNumber}`}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <StatusBadge status={unit.status} size="sm" />
                        <Button variant="outline" size="sm" asChild className="h-8 gap-1 text-xs">
                          <Link href={`/inventory-units/${unit.id}`}>
                            <QrCode className="size-3" />
                            <span>View Unit</span>
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
