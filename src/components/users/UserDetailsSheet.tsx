"use client";

import { useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useGetUserByIdQuery } from "@/redux/api/userApi";
import { useGetPermissionsQuery } from "@/redux/api/rbacApi";
import { TUser } from "@/type";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  SlidersHorizontal,
  KeyRound,
  Edit,
  Mail,
  Phone,
  Building2,
  Calendar,
  Clock,
  Search,
  CheckCircle2,
  PlusCircle,
  MinusCircle,
  Lock,
  Loader2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: TUser | null;
  onOpenEdit?: (user: TUser) => void;
  onOpenRoles?: (user: TUser) => void;
  onOpenPermissions?: (user: TUser) => void;
  onOpenStatus?: (user: TUser) => void;
}

type TDetailsTab = "ALL" | "ACTIVE" | "INHERITED" | "OVERRIDES" | "NO_ACCESS";

export default function UserDetailsSheet({
  open,
  onOpenChange,
  user,
  onOpenEdit,
  onOpenRoles,
  onOpenPermissions,
  onOpenStatus,
}: UserDetailsSheetProps) {
  // Fetch fresh user data with complete role permissions and overrides
  const { data: freshUserData, isLoading: isUserLoading } = useGetUserByIdQuery(
    user?.id || "",
    { skip: !user?.id || !open }
  );
  const activeUser = freshUserData?.data || user;

  const { data: permsData, isLoading: isPermsLoading } =
    useGetPermissionsQuery({ limit: 300 }, { skip: !open });
  const allPermissions = permsData?.data || [];

  // Local state for capability explorer
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState("ALL");
  const [filterTab, setFilterTab] = useState<TDetailsTab>("ALL");

  // Build role permission maps
  const { rolePermissionIdMap, rolePermissionCodeMap } = useMemo(() => {
    const idMap = new Map<string, Set<string>>();
    const codeMap = new Map<string, Set<string>>();

    if (activeUser?.roles && Array.isArray(activeUser.roles)) {
      activeUser.roles.forEach((ur: any) => {
        const roleObj = ur.role || ur;
        const roleName = roleObj.name || roleObj.code || "Role";
        if (roleObj.permissions && Array.isArray(roleObj.permissions)) {
          roleObj.permissions.forEach((rp: any) => {
            const p = rp.permission || rp;
            if (p?.id) {
              if (!idMap.has(p.id)) idMap.set(p.id, new Set());
              idMap.get(p.id)!.add(roleName);
            }
            if (p?.code) {
              if (!codeMap.has(p.code)) codeMap.set(p.code, new Set());
              codeMap.get(p.code)!.add(roleName);
            }
          });
        }
      });
    }

    return { rolePermissionIdMap: idMap, rolePermissionCodeMap: codeMap };
  }, [activeUser]);

  // Overrides map
  const overrideMap = useMemo(() => {
    const map: Record<string, "GRANT" | "REVOKE"> = {};
    if (activeUser?.permissions && Array.isArray(activeUser.permissions)) {
      activeUser.permissions.forEach((up: any) => {
        const permId = up.permissionId || up.permission?.id;
        if (permId) {
          if (up.effect === "GRANT" || up.granted === true) {
            map[permId] = "GRANT";
          } else if (up.effect === "REVOKE" || up.granted === false) {
            map[permId] = "REVOKE";
          }
        }
      });
    }
    return map;
  }, [activeUser]);

  // Helper to determine effective state
  const getPermissionEffectiveState = useMemo(() => {
    return (permId: string, permCode: string) => {
      const override = overrideMap[permId];
      const idRoles = rolePermissionIdMap.get(permId);
      const codeRoles = rolePermissionCodeMap.get(permCode);
      const combinedRoles = Array.from(
        new Set([...(idRoles ? Array.from(idRoles) : []), ...(codeRoles ? Array.from(codeRoles) : [])])
      );

      const isInherited = combinedRoles.length > 0 || !!activeUser?.isSuperAdmin;

      if (override === "GRANT") {
        return {
          isActive: true,
          type: "EXPLICIT_GRANT" as const,
          label: "+ Granted Override",
          badgeColor: "bg-emerald-600 text-white",
          inheritedRoles: combinedRoles,
        };
      }

      if (override === "REVOKE") {
        return {
          isActive: false,
          type: "EXPLICIT_REVOKE" as const,
          label: "- Revoked Override",
          badgeColor: "bg-rose-600 text-white",
          inheritedRoles: combinedRoles,
        };
      }

      if (isInherited) {
        return {
          isActive: true,
          type: "INHERITED" as const,
          label: activeUser?.isSuperAdmin
            ? "Root Bypass"
            : `Role: ${combinedRoles.join(", ")}`,
          badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
          inheritedRoles: combinedRoles,
        };
      }

      return {
        isActive: false,
        type: "NO_ACCESS" as const,
        label: "No Access",
        badgeColor: "text-muted-foreground border-border/80",
        inheritedRoles: [],
      };
    };
  }, [overrideMap, rolePermissionIdMap, rolePermissionCodeMap, activeUser?.isSuperAdmin]);

  // Overall statistics
  const stats = useMemo(() => {
    let explicitGrants = 0;
    let explicitRevokes = 0;
    let roleInheritedCount = 0;
    let totalActive = 0;

    allPermissions.forEach((p) => {
      const state = getPermissionEffectiveState(p.id, p.code);
      if (state.type === "EXPLICIT_GRANT") explicitGrants++;
      if (state.type === "EXPLICIT_REVOKE") explicitRevokes++;
      if (state.inheritedRoles.length > 0 || activeUser?.isSuperAdmin) {
        roleInheritedCount++;
      }
      if (state.isActive) totalActive++;
    });

    return {
      explicitGrants,
      explicitRevokes,
      totalOverrides: explicitGrants + explicitRevokes,
      roleInheritedCount,
      totalActive,
      noAccessCount: allPermissions.length - totalActive,
      totalPermissions: allPermissions.length,
    };
  }, [allPermissions, getPermissionEffectiveState, activeUser?.isSuperAdmin]);

  // Filter capabilities
  const filteredPermissions = useMemo(() => {
    return allPermissions.filter((perm) => {
      if (selectedModule !== "ALL" && perm.module !== selectedModule) {
        return false;
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = perm.name?.toLowerCase().includes(term);
        const matchesCode = perm.code?.toLowerCase().includes(term);
        const matchesDesc = perm.description?.toLowerCase().includes(term);
        if (!matchesName && !matchesCode && !matchesDesc) return false;
      }

      const state = getPermissionEffectiveState(perm.id, perm.code);
      if (filterTab === "ACTIVE" && !state.isActive) return false;
      if (filterTab === "INHERITED" && state.inheritedRoles.length === 0 && !activeUser?.isSuperAdmin) {
        return false;
      }
      if (filterTab === "OVERRIDES" && state.type !== "EXPLICIT_GRANT" && state.type !== "EXPLICIT_REVOKE") {
        return false;
      }
      if (filterTab === "NO_ACCESS" && state.isActive) return false;

      return true;
    });
  }, [allPermissions, selectedModule, searchTerm, filterTab, getPermissionEffectiveState, activeUser?.isSuperAdmin]);

  // Modules list
  const modules = useMemo(() => {
    const set = new Set<string>();
    allPermissions.forEach((p) => {
      if (p.module) set.add(p.module);
    });
    return Array.from(set).sort();
  }, [allPermissions]);

  const initials =
    activeUser?.firstName && activeUser?.lastName
      ? `${activeUser.firstName[0]}${activeUser.lastName[0]}`.toUpperCase()
      : (activeUser?.username || "U").slice(0, 2).toUpperCase();

  const assignedRoles = Array.isArray(activeUser?.roles) ? activeUser.roles : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl p-0 flex flex-col gap-0 shadow-2xl bg-card border-l overflow-hidden"
      >
        {/* Header Profile Section */}
        <div className="p-6 border-b bg-muted/20">
          <SheetHeader className="space-y-0 text-left">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="size-14 ring-2 ring-primary/20 shadow-xs">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-base">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <SheetTitle className="text-base font-bold text-foreground">
                      {activeUser?.firstName} {activeUser?.lastName || ""}
                    </SheetTitle>
                    <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0">
                      {activeUser?.employeeId}
                    </Badge>
                    {activeUser?.isSuperAdmin && (
                      <Badge
                        variant="secondary"
                        className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] px-1.5 py-0 font-medium"
                      >
                        Super Admin
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span>@{activeUser?.username}</span>
                    <span>•</span>
                    <Badge
                      variant={
                        activeUser?.status === "ACTIVE"
                          ? "default"
                          : activeUser?.status === "SUSPENDED"
                          ? "destructive"
                          : "secondary"
                      }
                      className="text-[9px] py-0 px-1.5 font-normal h-4"
                    >
                      {activeUser?.status}
                    </Badge>
                  </p>
                </div>
              </div>
            </div>

            <SheetDescription className="text-xs pt-2 text-muted-foreground">
              Institutional staff profile, assigned role capabilities, and effective permission overrides.
            </SheetDescription>
          </SheetHeader>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4 pt-3 border-t text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="size-3.5 text-primary shrink-0" />
              <span className="truncate text-foreground font-medium">{activeUser?.email || "—"}</span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="size-3.5 text-primary shrink-0" />
              <span className="truncate text-foreground font-medium">
                {activeUser?.department?.name || "Central Administration"}
              </span>
            </div>

            {activeUser?.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="size-3.5 text-primary shrink-0" />
                <span className="truncate text-foreground font-medium">{activeUser.phone}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="size-3.5 text-primary shrink-0" />
              <span>
                Joined {activeUser?.createdAt ? new Date(activeUser.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—"}
              </span>
            </div>
          </div>

          {/* Action Shortcuts Toolbar */}
          <div className="flex items-center gap-1.5 mt-4 pt-3 border-t overflow-x-auto scrollbar-none">
            {onOpenPermissions && (
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  if (activeUser) onOpenPermissions(activeUser);
                }}
                className="text-xs h-7 gap-1.5 bg-primary shadow-xs"
              >
                <SlidersHorizontal className="size-3" />
                <span>Override Permissions</span>
              </Button>
            )}

            {onOpenRoles && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (activeUser) onOpenRoles(activeUser);
                }}
                className="text-xs h-7 gap-1.5"
              >
                <KeyRound className="size-3 text-purple-600" />
                <span>Assign Roles</span>
              </Button>
            )}

            {onOpenEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (activeUser) onOpenEdit(activeUser);
                }}
                className="text-xs h-7 gap-1.5"
              >
                <Edit className="size-3" />
                <span>Edit Profile</span>
              </Button>
            )}

            {onOpenStatus && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (activeUser) onOpenStatus(activeUser);
                }}
                className="text-xs h-7 gap-1.5 text-amber-700 dark:text-amber-400 hover:text-amber-800"
              >
                <ShieldAlert className="size-3" />
                <span>Status</span>
              </Button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Assigned Roles Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <KeyRound className="size-3.5 text-primary" />
                <span>Assigned Institutional Roles ({assignedRoles.length})</span>
              </h4>
              {onOpenRoles && activeUser && (
                <button
                  type="button"
                  onClick={() => onOpenRoles(activeUser)}
                  className="text-[11px] text-primary hover:underline font-medium"
                >
                  Manage Roles
                </button>
              )}
            </div>

            {assignedRoles.length === 0 ? (
              <div className="p-4 rounded-lg border border-dashed text-center text-xs text-muted-foreground">
                No roles assigned. User has no default system capabilities.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {assignedRoles.map((ur: any, idx) => {
                  const r = ur.role || ur;
                  const permsCount = Array.isArray(r.permissions) ? r.permissions.length : null;

                  return (
                    <div
                      key={r.id || idx}
                      className="p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors space-y-1 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-xs text-foreground truncate">
                          {r.name || r.code}
                        </span>
                        {r.isSystemRole && (
                          <Badge variant="secondary" className="text-[9px] py-0 px-1 font-mono">
                            System
                          </Badge>
                        )}
                      </div>

                      {r.description && (
                        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                          {r.description}
                        </p>
                      )}

                      {permsCount !== null && (
                        <div className="pt-1 text-[10px] text-primary font-medium flex items-center gap-1">
                          <CheckCircle2 className="size-2.5" />
                          <span>Provides {permsCount} base capabilities</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Separator />

          {/* Access & Permissions Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Shield className="size-3.5 text-primary" />
                <span>Access Profile & Permissions Posture</span>
              </h4>

              {onOpenPermissions && activeUser && (
                <button
                  type="button"
                  onClick={() => onOpenPermissions(activeUser)}
                  className="text-[11px] text-primary hover:underline font-medium"
                >
                  Configure Overrides
                </button>
              )}
            </div>

            {/* 4 Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2.5 rounded-lg border bg-muted/30">
                <span className="text-[10px] text-muted-foreground block font-medium">
                  Effective Perms
                </span>
                <span className="text-sm font-bold text-foreground">
                  {activeUser?.isSuperAdmin ? "ALL (Root)" : `${stats.totalActive} Active`}
                </span>
              </div>

              <div className="p-2.5 rounded-lg border bg-muted/30">
                <span className="text-[10px] text-muted-foreground block font-medium">
                  Role-Inherited
                </span>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {stats.roleInheritedCount}
                </span>
              </div>

              <div className="p-2.5 rounded-lg border bg-muted/30">
                <span className="text-[10px] text-muted-foreground block font-medium">
                  Explicit Grants
                </span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  +{stats.explicitGrants}
                </span>
              </div>

              <div className="p-2.5 rounded-lg border bg-muted/30">
                <span className="text-[10px] text-muted-foreground block font-medium">
                  Explicit Revokes
                </span>
                <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                  -{stats.explicitRevokes}
                </span>
              </div>
            </div>

            {/* Explanatory Alert if overrides exist */}
            {stats.totalOverrides > 0 ? (
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-2">
                <Sparkles className="size-4 shrink-0 mt-0.5 text-emerald-600" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-[11px]">User Has Custom Permission Overrides</p>
                  <p className="text-[11px] text-emerald-700/90 dark:text-emerald-300/90">
                    This user's capabilities differ from standard role assignments ({stats.explicitGrants} extra granted, {stats.explicitRevokes} revoked).
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-muted/30 border text-xs text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-muted-foreground shrink-0" />
                <span>Following standard institutional role defaults. No individual overrides applied.</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Interactive Capability Explorer */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Capability Explorer ({filteredPermissions.length})
              </h4>

              <div className="relative w-full sm:w-60">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                <Input
                  placeholder="Filter capability..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 h-7 text-xs bg-background"
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-0.5">
              <button
                type="button"
                onClick={() => setFilterTab("ALL")}
                className={cn(
                  "text-[10px] font-medium px-2 py-0.5 rounded-md border transition-colors shrink-0",
                  filterTab === "ALL"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                )}
              >
                All ({allPermissions.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab("ACTIVE")}
                className={cn(
                  "text-[10px] font-medium px-2 py-0.5 rounded-md border transition-colors shrink-0",
                  filterTab === "ACTIVE"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                )}
              >
                Active ({stats.totalActive})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab("INHERITED")}
                className={cn(
                  "text-[10px] font-medium px-2 py-0.5 rounded-md border transition-colors shrink-0",
                  filterTab === "INHERITED"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                )}
              >
                From Roles ({stats.roleInheritedCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab("OVERRIDES")}
                className={cn(
                  "text-[10px] font-medium px-2 py-0.5 rounded-md border transition-colors shrink-0",
                  filterTab === "OVERRIDES"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                )}
              >
                Overrides ({stats.totalOverrides})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab("NO_ACCESS")}
                className={cn(
                  "text-[10px] font-medium px-2 py-0.5 rounded-md border transition-colors shrink-0",
                  filterTab === "NO_ACCESS"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                )}
              >
                No Access ({stats.noAccessCount})
              </button>
            </div>

            {/* Module Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1">
              <button
                type="button"
                onClick={() => setSelectedModule("ALL")}
                className={cn(
                  "text-[9px] font-medium px-2 py-0.5 rounded-full border transition-colors shrink-0",
                  selectedModule === "ALL"
                    ? "bg-muted text-foreground border-foreground/30 font-bold"
                    : "text-muted-foreground border-border/70 hover:bg-muted/50"
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
                    "text-[9px] font-medium px-2 py-0.5 rounded-full border transition-colors shrink-0",
                    selectedModule === mod
                      ? "bg-muted text-foreground border-foreground/30 font-bold"
                      : "text-muted-foreground border-border/70 hover:bg-muted/50"
                  )}
                >
                  {mod}
                </button>
              ))}
            </div>

            {/* Capabilities List */}
            {isPermsLoading || isUserLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-4 animate-spin text-primary" />
                <span>Loading capability inventory...</span>
              </div>
            ) : filteredPermissions.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted-foreground">
                No capabilities match the selected filters.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                {filteredPermissions.map((perm) => {
                  const state = getPermissionEffectiveState(perm.id, perm.code);

                  return (
                    <div
                      key={perm.id}
                      className={cn(
                        "p-2.5 rounded-lg border text-xs flex items-center justify-between gap-3 transition-colors",
                        state.type === "EXPLICIT_GRANT"
                          ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800"
                          : state.type === "EXPLICIT_REVOKE"
                          ? "bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800"
                          : "bg-card hover:bg-muted/30"
                      )}
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-foreground truncate">
                            {perm.name}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground bg-muted/80 px-1 rounded">
                            {perm.code}
                          </span>
                        </div>
                        {perm.description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-1">
                            {perm.description}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 flex items-center gap-1">
                        <Badge
                          variant="secondary"
                          className={cn("text-[10px] py-0 px-2 font-medium", state.badgeColor)}
                        >
                          {state.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/20 flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            Employee ID: <span className="font-mono font-medium text-foreground">{activeUser?.employeeId}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Close
            </Button>
            {onOpenPermissions && activeUser && (
              <Button
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onOpenPermissions(activeUser);
                }}
                className="text-xs bg-primary gap-1.5 shadow-xs"
              >
                <SlidersHorizontal className="size-3" />
                <span>Configure Overrides</span>
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
