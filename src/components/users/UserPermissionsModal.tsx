"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useGetPermissionsQuery } from "@/redux/api/rbacApi";
import {
  useGetUserByIdQuery,
  useOverrideUserPermissionsMutation,
} from "@/redux/api/userApi";
import { TUser } from "@/type";
import { toast } from "sonner";
import {
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Search,
  RotateCcw,
  PlusCircle,
  MinusCircle,
  Building2,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserPermissionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: TUser | null;
  onOpenRoles?: () => void;
}

export default function UserPermissionsModal({
  open,
  onOpenChange,
  user,
  onOpenRoles,
}: UserPermissionsModalProps) {
  // Always fetch fresh user data including assigned roles, role permissions, and active overrides
  const { data: freshUserData, isLoading: isUserLoading } = useGetUserByIdQuery(
    user?.id || "",
    { skip: !user?.id || !open }
  );
  const activeUser = freshUserData?.data || user;

  const { data: permsData, isLoading: isPermsLoading } =
    useGetPermissionsQuery({ limit: 300 });
  const [overrideUserPermissions, { isLoading: isSaving }] =
    useOverrideUserPermissionsMutation();

  const allPermissions = permsData?.data || [];

  // Map of permissionId -> "GRANT" | "REVOKE" | "DEFAULT"
  const [overrideMap, setOverrideMap] = useState<
    Record<string, "GRANT" | "REVOKE" | "DEFAULT">
  >({});

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState("ALL");
  const [stateFilter, setStateFilter] = useState<
    "ALL" | "ACTIVE" | "OVERRIDES" | "REVOKED"
  >("ALL");

  // 1. Build map of permissions inherited via user's assigned roles
  const rolePermissionMap = useMemo(() => {
    const map = new Map<string, string>(); // permissionId or code -> roleName
    if (activeUser?.roles && Array.isArray(activeUser.roles)) {
      activeUser.roles.forEach((ur: any) => {
        const roleObj = ur.role || ur;
        const roleName = roleObj.name || roleObj.code || "Assigned Role";
        if (roleObj.permissions && Array.isArray(roleObj.permissions)) {
          roleObj.permissions.forEach((rp: any) => {
            const p = rp.permission || rp;
            if (p?.id) map.set(p.id, roleName);
            if (p?.code) map.set(p.code, roleName);
          });
        }
      });
    }
    return map;
  }, [activeUser]);

  // 2. Synchronize active overrides when modal opens or fresh user data arrives
  useEffect(() => {
    if (!open) return;
    if (activeUser && Array.isArray(activeUser.permissions)) {
      const initial: Record<string, "GRANT" | "REVOKE" | "DEFAULT"> = {};
      activeUser.permissions.forEach((up: any) => {
        const permId = up.permissionId || up.permission?.id;
        if (permId) {
          // Robust check for effect: "GRANT" | "REVOKE"
          if (up.effect === "GRANT" || up.granted === true) {
            initial[permId] = "GRANT";
          } else if (up.effect === "REVOKE" || up.granted === false) {
            initial[permId] = "REVOKE";
          }
        }
      });
      setOverrideMap(initial);
    } else {
      setOverrideMap({});
    }
    setSearchTerm("");
    setSelectedModule("ALL");
    setStateFilter("ALL");
  }, [activeUser?.id, open]);

  // Modules list
  const modules = useMemo(() => {
    const set = new Set<string>();
    allPermissions.forEach((p) => {
      if (p.module) set.add(p.module);
    });
    return Array.from(set).sort();
  }, [allPermissions]);

  // Helper to determine effective state of a permission
  const getPermissionEffectiveState = (permId: string, permCode: string) => {
    const override = overrideMap[permId] || "DEFAULT";
    const isInherited =
      rolePermissionMap.has(permId) || rolePermissionMap.has(permCode);
    const roleName =
      rolePermissionMap.get(permId) || rolePermissionMap.get(permCode);

    if (override === "GRANT") {
      return {
        isActive: true,
        type: "EXPLICIT_GRANT" as const,
        label: "Explicitly Granted (+Override)",
        badgeVariant: "default" as const,
        roleName,
      };
    }

    if (override === "REVOKE") {
      return {
        isActive: false,
        type: "EXPLICIT_REVOKE" as const,
        label: "Explicitly Revoked (-Override)",
        badgeVariant: "destructive" as const,
        roleName,
      };
    }

    if (isInherited) {
      return {
        isActive: true,
        type: "INHERITED" as const,
        label: `Granted via Role (${roleName})`,
        badgeVariant: "secondary" as const,
        roleName,
      };
    }

    return {
      isActive: false,
      type: "NO_ACCESS" as const,
      label: "No Access (Role Default)",
      badgeVariant: "outline" as const,
      roleName: null,
    };
  };

  // Compute summary stats
  const stats = useMemo(() => {
    let explicitGrants = 0;
    let explicitRevokes = 0;
    let totalActive = 0;

    allPermissions.forEach((p) => {
      const state = getPermissionEffectiveState(p.id, p.code);
      if (state.type === "EXPLICIT_GRANT") explicitGrants++;
      if (state.type === "EXPLICIT_REVOKE") explicitRevokes++;
      if (state.isActive) totalActive++;
    });

    return {
      explicitGrants,
      explicitRevokes,
      totalActive,
      totalPermissions: allPermissions.length,
    };
  }, [allPermissions, overrideMap, rolePermissionMap]);

  // Filter permissions
  const filteredPermissions = useMemo(() => {
    return allPermissions.filter((perm) => {
      // Module filter
      if (selectedModule !== "ALL" && perm.module !== selectedModule) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = perm.name.toLowerCase().includes(term);
        const matchesCode = perm.code.toLowerCase().includes(term);
        const matchesDesc = perm.description?.toLowerCase().includes(term);
        if (!matchesName && !matchesCode && !matchesDesc) return false;
      }

      // State filter
      const state = getPermissionEffectiveState(perm.id, perm.code);
      if (stateFilter === "ACTIVE" && !state.isActive) return false;
      if (
        stateFilter === "OVERRIDES" &&
        state.type !== "EXPLICIT_GRANT" &&
        state.type !== "EXPLICIT_REVOKE"
      )
        return false;
      if (stateFilter === "REVOKED" && state.type !== "EXPLICIT_REVOKE")
        return false;

      return true;
    });
  }, [allPermissions, selectedModule, searchTerm, stateFilter, overrideMap, rolePermissionMap]);

  // Group filtered permissions by module
  const groupedPermissions = useMemo(() => {
    const map = new Map<string, typeof allPermissions>();
    filteredPermissions.forEach((p) => {
      const mod = p.module || "General";
      if (!map.has(mod)) map.set(mod, []);
      map.get(mod)!.push(p);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredPermissions]);

  const handleSetState = (
    permissionId: string,
    state: "GRANT" | "REVOKE" | "DEFAULT"
  ) => {
    setOverrideMap((prev) => {
      const next = { ...prev };
      if (state === "DEFAULT") {
        delete next[permissionId];
      } else {
        next[permissionId] = state;
      }
      return next;
    });
  };

  const handleResetAllToRoleDefaults = () => {
    setOverrideMap({});
    toast.info("All overrides cleared. Click 'Save Permission Overrides' to persist.");
  };

  const handleResetModuleToDefaults = (moduleName: string) => {
    const modulePermIds = new Set(
      allPermissions.filter((p) => p.module === moduleName).map((p) => p.id)
    );
    setOverrideMap((prev) => {
      const next = { ...prev };
      modulePermIds.forEach((id) => delete next[id]);
      return next;
    });
    toast.info(`Overrides for ${moduleName} module reset to role defaults.`);
  };

  const handleSave = async () => {
    if (!activeUser) return;
    try {
      const overrides = Object.entries(overrideMap)
        .filter(([_, effect]) => effect === "GRANT" || effect === "REVOKE")
        .map(([permissionId, effect]) => ({
          permissionId,
          effect: effect as "GRANT" | "REVOKE",
        }));

      await overrideUserPermissions({
        id: activeUser.id,
        overrides,
      }).unwrap();

      toast.success(
        overrides.length > 0
          ? `Saved ${overrides.length} explicit permission override(s) for ${activeUser.firstName} 🎉`
          : `Reset all permission overrides to role defaults for ${activeUser.firstName} 🎉`
      );
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update overrides");
    }
  };

  const initials =
    activeUser?.firstName && activeUser?.lastName
      ? `${activeUser.firstName[0]}${activeUser.lastName[0]}`.toUpperCase()
      : (activeUser?.username || "U").slice(0, 2).toUpperCase();

  const userRoles = Array.isArray(activeUser?.roles)
    ? activeUser.roles.map((r: any) =>
        typeof r === "string" ? r : r.role?.name || r.role?.code
      )
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] p-0 gap-0 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 pb-3 border-b bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <ShieldCheck className="size-5 text-primary" />
              Granular Permission Overrides
            </DialogTitle>
            <DialogDescription className="text-xs">
              Explicitly grant or revoke system capabilities for this individual user beyond their assigned role defaults.
            </DialogDescription>
          </DialogHeader>

          {/* User Profile Summary */}
          {activeUser && (
            <div className="mt-3 p-3 rounded-lg border bg-muted/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar className="size-9 shrink-0 border border-border">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-xs text-foreground truncate">
                      {activeUser.firstName} {activeUser.lastName || ""}
                    </span>
                    <Badge variant="outline" className="font-mono text-[10px] py-0 px-1.5">
                      {activeUser.employeeId}
                    </Badge>
                    {activeUser.isSuperAdmin && (
                      <Badge
                        variant="secondary"
                        className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] px-1.5 py-0"
                      >
                        Super Admin
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5 truncate">
                    <span>{activeUser.email}</span>
                    {activeUser.department && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 truncate">
                          <Building2 className="size-3 shrink-0" />
                          {activeUser.department.name}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Roles Badge List */}
              <div className="flex flex-wrap items-center gap-1 sm:justify-end shrink-0">
                {userRoles.length === 0 ? (
                  <span className="text-[11px] text-muted-foreground italic">
                    No roles assigned
                  </span>
                ) : (
                  userRoles.map((rName, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="text-[10px] py-0 bg-background font-medium"
                    >
                      {rName}
                    </Badge>
                  ))
                )}
                {onOpenRoles && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={onOpenRoles}
                    className="text-[10px] h-5 px-1.5 text-primary hover:underline"
                  >
                    Edit Roles
                  </Button>
                )}
              </div>
            </div>
          )}

          {activeUser?.isSuperAdmin && (
            <div className="mt-2 p-2 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] flex items-center gap-2">
              <ShieldAlert className="size-4 shrink-0 text-amber-600" />
              <span>
                Super Admin has absolute root bypass. Role permissions and explicit overrides will not restrict Super Admin actions.
              </span>
            </div>
          )}

          {/* RBAC Overview Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-2.5 border-t border-border/60 text-center">
            <div className="bg-muted/40 p-1.5 rounded border border-border/40">
              <span className="text-[10px] text-muted-foreground block font-medium">
                Effective Capabilities
              </span>
              <span className="text-xs font-bold text-foreground">
                {activeUser?.isSuperAdmin ? "ALL (Root)" : `${stats.totalActive} Active`}
              </span>
            </div>
            <div className="bg-muted/40 p-1.5 rounded border border-border/40">
              <span className="text-[10px] text-muted-foreground block font-medium">
                Role-Inherited
              </span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                {new Set(Array.from(rolePermissionMap.keys())).size} from Roles
              </span>
            </div>
            <div className="bg-muted/40 p-1.5 rounded border border-border/40">
              <span className="text-[10px] text-muted-foreground block font-medium">
                Explicit Grants (+)
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                +{stats.explicitGrants} Overrides
              </span>
            </div>
            <div className="bg-muted/40 p-1.5 rounded border border-border/40">
              <span className="text-[10px] text-muted-foreground block font-medium">
                Explicit Revokes (-)
              </span>
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                -{stats.explicitRevokes} Overrides
              </span>
            </div>
          </div>
        </div>

        {/* Toolbar: Search, Module Filter, State Filter */}
        <div className="p-3 bg-card border-b space-y-2">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search capability by name or code (e.g., requisition.create)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-xs bg-background"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto shrink-0">
              <Button
                type="button"
                variant={stateFilter === "ALL" ? "default" : "outline"}
                size="xs"
                onClick={() => setStateFilter("ALL")}
                className="text-[11px] h-7 px-2"
              >
                All ({allPermissions.length})
              </Button>
              <Button
                type="button"
                variant={stateFilter === "ACTIVE" ? "default" : "outline"}
                size="xs"
                onClick={() => setStateFilter("ACTIVE")}
                className="text-[11px] h-7 px-2"
              >
                Active Only ({stats.totalActive})
              </Button>
              <Button
                type="button"
                variant={stateFilter === "OVERRIDES" ? "default" : "outline"}
                size="xs"
                onClick={() => setStateFilter("OVERRIDES")}
                className="text-[11px] h-7 px-2"
              >
                Overrides Only ({stats.explicitGrants + stats.explicitRevokes})
              </Button>
              {(stats.explicitGrants > 0 || stats.explicitRevokes > 0) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={handleResetAllToRoleDefaults}
                  className="text-[11px] h-7 px-2 text-muted-foreground hover:text-foreground gap-1"
                >
                  <RotateCcw className="size-3" />
                  <span>Reset All</span>
                </Button>
              )}
            </div>
          </div>

          {/* Module Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 pt-0.5 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedModule("ALL")}
              className={cn(
                "text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors shrink-0",
                selectedModule === "ALL"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
              )}
            >
              All Modules
            </button>
            {modules.map((mod) => (
              <button
                key={mod}
                type="button"
                onClick={() => setSelectedModule(mod)}
                className={cn(
                  "text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors shrink-0",
                  selectedModule === mod
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                )}
              >
                {mod}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Permissions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
          {isPermsLoading || isUserLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
              <Loader2 className="size-5 animate-spin text-primary" />
              <span>Loading permission registry...</span>
            </div>
          ) : groupedPermissions.length === 0 ? (
            <div className="py-16 text-center text-xs text-muted-foreground">
              No capabilities matched the selected filters.
            </div>
          ) : (
            groupedPermissions.map(([moduleName, perms]) => (
              <div
                key={moduleName}
                className="rounded-lg border border-border bg-card overflow-hidden shadow-2xs"
              >
                <div className="px-3.5 py-2 border-b bg-muted/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                      {moduleName} Module
                    </span>
                    <Badge variant="outline" className="text-[10px] py-0">
                      {perms.length} capabilities
                    </Badge>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleResetModuleToDefaults(moduleName)}
                    className="text-[10px] text-muted-foreground hover:text-foreground underline transition-colors"
                  >
                    Reset module defaults
                  </button>
                </div>

                <div className="divide-y divide-border/50">
                  {perms.map((perm) => {
                    const currentOverride = overrideMap[perm.id] || "DEFAULT";
                    const state = getPermissionEffectiveState(perm.id, perm.code);

                    return (
                      <div
                        key={perm.id}
                        className={cn(
                          "p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors",
                          currentOverride === "GRANT"
                            ? "bg-emerald-50/40 dark:bg-emerald-950/15"
                            : currentOverride === "REVOKE"
                            ? "bg-rose-50/40 dark:bg-rose-950/15"
                            : "hover:bg-muted/30"
                        )}
                      >
                        {/* Capability Details */}
                        <div className="space-y-1 min-w-0 max-w-lg">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-foreground">
                              {perm.name}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground bg-muted/60 px-1 rounded">
                              {perm.code}
                            </span>
                          </div>

                          {perm.description && (
                            <p className="text-[11px] text-muted-foreground line-clamp-1">
                              {perm.description}
                            </p>
                          )}

                          {/* Effective Status Badge */}
                          <div className="flex items-center gap-1.5 pt-0.5">
                            {state.type === "EXPLICIT_GRANT" && (
                              <Badge
                                variant="default"
                                className="bg-emerald-600 hover:bg-emerald-600 text-white text-[9px] py-0 px-1.5 gap-1 font-medium"
                              >
                                <PlusCircle className="size-2.5" />
                                {state.label}
                              </Badge>
                            )}

                            {state.type === "EXPLICIT_REVOKE" && (
                              <Badge
                                variant="destructive"
                                className="text-[9px] py-0 px-1.5 gap-1 font-medium"
                              >
                                <MinusCircle className="size-2.5" />
                                {state.label}
                              </Badge>
                            )}

                            {state.type === "INHERITED" && (
                              <Badge
                                variant="secondary"
                                className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[9px] py-0 px-1.5 gap-1 font-medium"
                              >
                                <CheckCircle2 className="size-2.5 text-blue-600" />
                                {state.label}
                              </Badge>
                            )}

                            {state.type === "NO_ACCESS" && (
                              <Badge
                                variant="outline"
                                className="text-muted-foreground text-[9px] py-0 px-1.5 gap-1 font-medium border-border/60"
                              >
                                <Lock className="size-2.5 text-muted-foreground" />
                                {state.label}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* 3-State Segmented Control */}
                        <div className="flex items-center gap-1 shrink-0 self-end sm:self-center bg-muted/50 p-0.5 rounded-lg border border-border/80">
                          <button
                            type="button"
                            onClick={() => handleSetState(perm.id, "DEFAULT")}
                            className={cn(
                              "px-2 py-1 text-[10px] font-medium rounded transition-all",
                              currentOverride === "DEFAULT"
                                ? "bg-background text-foreground shadow-xs font-semibold"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            Role Default
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSetState(perm.id, "GRANT")}
                            className={cn(
                              "px-2.5 py-1 text-[10px] font-medium rounded transition-all flex items-center gap-1",
                              currentOverride === "GRANT"
                                ? "bg-emerald-600 text-white font-bold shadow-xs"
                                : "text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/50"
                            )}
                          >
                            <PlusCircle className="size-3" />
                            Grant (+)
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSetState(perm.id, "REVOKE")}
                            className={cn(
                              "px-2.5 py-1 text-[10px] font-medium rounded transition-all flex items-center gap-1",
                              currentOverride === "REVOKE"
                                ? "bg-rose-600 text-white font-bold shadow-xs"
                                : "text-rose-700 dark:text-rose-400 hover:bg-rose-100/50 dark:hover:bg-rose-950/50"
                            )}
                          >
                            <MinusCircle className="size-3" />
                            Revoke (-)
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-card flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            {stats.explicitGrants > 0 || stats.explicitRevokes > 0 ? (
              <span>
                <strong className="text-foreground">
                  {stats.explicitGrants + stats.explicitRevokes}
                </strong>{" "}
                active override(s) configured
              </span>
            ) : (
              <span>All capabilities following role defaults</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isSaving || isPermsLoading || isUserLoading}
              className="text-xs bg-primary gap-1.5"
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Saving Overrides...</span>
                </>
              ) : (
                <span>Save Permission Overrides</span>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
