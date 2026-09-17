"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import SearchInput from "@/components/shared/SearchInput";
import FilterSelect from "@/components/shared/FilterSelect";
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
  Search,
  CheckCircle2,
  PlusCircle,
  MinusCircle,
  Lock,
  Loader2,
  Sparkles,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: TUser | null;
  onOpenEdit?: (user: TUser) => void;
  onOpenRoles?: (user: TUser) => void;
  onOpenPermissions?: (user: TUser) => void;
  onOpenStatus?: (user: TUser) => void;
}

type TDetailsTab = "ALL" | "ACTIVE" | "INHERITED" | "OVERRIDES" | "NO_ACCESS";

export default function UserDetailsModal({
  open,
  onOpenChange,
  user,
  onOpenEdit,
  onOpenRoles,
  onOpenPermissions,
  onOpenStatus,
}: UserDetailsModalProps) {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[92vh] p-0 gap-0 overflow-hidden flex flex-col shadow-2xl">
        {/* Header Profile Section */}
        <div className="p-6 pb-4 border-b bg-muted/20">
          <DialogHeader className="space-y-0 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <Avatar className="size-14 ring-2 ring-primary/20 shadow-xs">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <DialogTitle className="text-lg font-bold text-foreground">
                      {activeUser?.firstName} {activeUser?.lastName || ""}
                    </DialogTitle>
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
                    <Badge
                      variant={
                        activeUser?.status === "ACTIVE"
                          ? "default"
                          : activeUser?.status === "SUSPENDED"
                          ? "destructive"
                          : "secondary"
                      }
                      className="text-[10px] py-0 px-1.5 font-medium"
                    >
                      {activeUser?.status}
                    </Badge>
                  </div>

                  <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2">
                    <span>@{activeUser?.username}</span>
                    <span>•</span>
                    <span>{activeUser?.email}</span>
                  </DialogDescription>
                </div>
              </div>

              {/* Action Shortcuts Toolbar */}
              <div className="flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
                {onOpenPermissions && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      if (activeUser) {
                        onOpenChange(false);
                        onOpenPermissions(activeUser);
                      }
                    }}
                    className="text-xs h-7 gap-1.5 bg-primary shadow-xs"
                  >
                    <SlidersHorizontal className="size-3" />
                    <span>Overrides</span>
                  </Button>
                )}

                {onOpenRoles && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (activeUser) {
                        onOpenChange(false);
                        onOpenRoles(activeUser);
                      }
                    }}
                    className="text-xs h-7 gap-1.5"
                  >
                    <KeyRound className="size-3 text-purple-600" />
                    <span>Roles</span>
                  </Button>
                )}

                {onOpenEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (activeUser) {
                        onOpenChange(false);
                        onOpenEdit(activeUser);
                      }
                    }}
                    className="text-xs h-7 gap-1.5"
                  >
                    <Edit className="size-3" />
                    <span>Edit</span>
                  </Button>
                )}

                {onOpenStatus && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (activeUser) {
                        onOpenChange(false);
                        onOpenStatus(activeUser);
                      }
                    }}
                    className="text-xs h-7 gap-1.5 text-amber-700 dark:text-amber-400 hover:text-amber-800"
                  >
                    <ShieldAlert className="size-3" />
                    <span>Status</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Quick Metadata Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t text-xs">
              <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                <Building2 className="size-3.5 text-primary shrink-0" />
                <span className="truncate text-foreground font-medium">
                  {activeUser?.department?.name || "Central Administration"}
                </span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                <Mail className="size-3.5 text-primary shrink-0" />
                <span className="truncate text-foreground font-medium">
                  {activeUser?.email || "—"}
                </span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                <Phone className="size-3.5 text-primary shrink-0" />
                <span className="truncate text-foreground font-medium">
                  {activeUser?.phone || "No phone"}
                </span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                <Calendar className="size-3.5 text-primary shrink-0" />
                <span className="truncate text-muted-foreground">
                  Joined {activeUser?.createdAt ? new Date(activeUser.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—"}
                </span>
              </div>
            </div>
          </DialogHeader>
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
                  onClick={() => {
                    onOpenChange(false);
                    onOpenRoles(activeUser);
                  }}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
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
                          <span>{permsCount} role capabilities</span>
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
                  onClick={() => {
                    onOpenChange(false);
                    onOpenPermissions(activeUser);
                  }}
                  className="text-[11px] text-primary hover:underline font-medium"
                >
                  Configure Overrides
                </button>
              )}
            </div>

            {/* 4 Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
              <div className="p-3 rounded-lg border bg-muted/30">
                <span className="text-[10px] text-muted-foreground block font-medium">
                  Effective Perms
                </span>
                <span className="text-base font-bold text-foreground">
                  {activeUser?.isSuperAdmin ? "ALL (Root)" : `${stats.totalActive} Active`}
                </span>
              </div>

              <div className="p-3 rounded-lg border bg-muted/30">
                <span className="text-[10px] text-muted-foreground block font-medium">
                  Role-Inherited
                </span>
                <span className="text-base font-bold text-blue-600 dark:text-blue-400">
                  {stats.roleInheritedCount}
                </span>
              </div>

              <div className="p-3 rounded-lg border bg-muted/30">
                <span className="text-[10px] text-muted-foreground block font-medium">
                  Explicit Grants
                </span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                  +{stats.explicitGrants}
                </span>
              </div>

              <div className="p-3 rounded-lg border bg-muted/30">
                <span className="text-[10px] text-muted-foreground block font-medium">
                  Explicit Revokes
                </span>
                <span className="text-base font-bold text-rose-600 dark:text-rose-400">
                  -{stats.explicitRevokes}
                </span>
              </div>
            </div>

            {/* Explanatory Alert */}
            {stats.totalOverrides > 0 ? (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-2.5">
                <Sparkles className="size-4 shrink-0 mt-0.5 text-emerald-600" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-xs">User Has Custom Permission Overrides</p>
                  <p className="text-[11px] text-emerald-700/90 dark:text-emerald-300/90">
                    This staff member has {stats.explicitGrants} extra capabilities granted and {stats.explicitRevokes} capabilities revoked relative to their standard role profile.
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
            {/* Capability Explorer Filters using SearchInput and FilterSelect */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="w-full sm:flex-1">
                <SearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Filter capabilities..."
                
                />
              </div>

              <div className="w-full sm:w-52">
                <FilterSelect
                  placeholder="Access Status"
                  value={filterTab === "ALL" ? "" : filterTab}
                  onChange={(val) => setFilterTab((val as TDetailsTab) || "ALL")}
                  options={[
                    { label: `Active (${stats.totalActive})`, value: "ACTIVE" },
                    { label: `From Roles (${stats.roleInheritedCount})`, value: "INHERITED" },
                    { label: `Custom Overrides (${stats.totalOverrides})`, value: "OVERRIDES" },
                    { label: `No Access (${stats.noAccessCount})`, value: "NO_ACCESS" },
                  ]}
                  includeAllOption
                  allLabel={`All Capabilities (${allPermissions.length})`}
               
                />
              </div>

              <div className="w-full sm:w-48">
                <FilterSelect
                  placeholder="Module"
                  value={selectedModule === "ALL" ? "" : selectedModule}
                  onChange={(val) => setSelectedModule(val || "ALL")}
                  options={modules.map((mod) => ({
                    label: mod.charAt(0).toUpperCase() + mod.slice(1),
                    value: mod,
                  }))}
                  includeAllOption
                  allLabel={`All Modules (${allPermissions.length})`}
                
                />
              </div>
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
              <div className="space-y-1.5  pr-1">
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

     
      </DialogContent>
    </Dialog>
  );
}
