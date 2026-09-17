"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useGetRolesQuery, useGetPermissionsQuery } from "@/redux/api/rbacApi";
import {
  useGetUserByIdQuery,
  useAssignUserRolesMutation,
  useOverrideUserPermissionsMutation,
} from "@/redux/api/userApi";
import { TPermission, TRole, TUser, TUserPermission, TUserRole } from "@/type";
import { toast } from "sonner";
import {
  TFilterTab,
  TOverrideState,
  TEffectivePermissionState,
  TAccessStats,
} from "./types";

interface UseAccessControlEngineProps {
  open: boolean;
  user: TUser | null;
  initialTab?: "ROLES" | "OVERRIDES" | "MATRIX";
  onSuccess?: () => void;
}

export function useAccessControlEngine({
  open,
  user,
  initialTab = "ROLES",
  onSuccess,
}: UseAccessControlEngineProps) {
  // 1. Data queries
  const { data: freshUserData, isLoading: isUserLoading } = useGetUserByIdQuery(
    user?.id || "",
    { skip: !user?.id || !open }
  );
  const activeUser: TUser | null = freshUserData?.data || user;

  const { data: rolesData, isLoading: isRolesLoading } = useGetRolesQuery(
    undefined,
    { skip: !open }
  );
  const { data: permsData, isLoading: isPermsLoading } = useGetPermissionsQuery(
    { limit: 300 },
    { skip: !open }
  );

  const [assignUserRoles, { isLoading: isSavingRoles }] =
    useAssignUserRolesMutation();
  const [overrideUserPermissions, { isLoading: isSavingOverrides }] =
    useOverrideUserPermissionsMutation();

  const allRoles: TRole[] = rolesData?.data || [];
  const allPermissions: TPermission[] = permsData?.data || [];

  // 2. Active Tab State
  const [activeTab, setActiveTab] = useState<"ROLES" | "OVERRIDES" | "MATRIX">(
    initialTab
  );

  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
    }
  }, [open, initialTab]);

  // ========================================================
  // ROLES STATE & SELECTION
  // ========================================================
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [savedRoleIds, setSavedRoleIds] = useState<string[]>([]);
  const [roleSearchTerm, setRoleSearchTerm] = useState("");

  useEffect(() => {
    if (!open) {
      setSelectedRoleIds([]);
      setSavedRoleIds([]);
      return;
    }
    if (activeUser && Array.isArray(activeUser.roles)) {
      const currentIds = (activeUser.roles as (TUserRole | string)[])
        .map((r) =>
          typeof r === "string" ? r : r.roleId || r.role?.id || (r as any).id
        )
        .filter((id): id is string => Boolean(id));
      setSelectedRoleIds(currentIds);
      setSavedRoleIds(currentIds);
    } else {
      setSelectedRoleIds([]);
      setSavedRoleIds([]);
    }
    setRoleSearchTerm("");
  }, [open, activeUser?.id, freshUserData?.data?.roles]);

  const isRolesDirty = useMemo(() => {
    if (selectedRoleIds.length !== savedRoleIds.length) return true;
    const setSaved = new Set(savedRoleIds);
    return selectedRoleIds.some((id) => !setSaved.has(id));
  }, [selectedRoleIds, savedRoleIds]);

  const toggleRole = useCallback((roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );
  }, []);

  const handleSelectAllRoles = useCallback(() => {
    setSelectedRoleIds(allRoles.map((r) => r.id));
  }, [allRoles]);

  const handleClearAllRoles = useCallback(() => {
    setSelectedRoleIds([]);
  }, []);

  const filteredRoles = useMemo(() => {
    if (!roleSearchTerm.trim()) return allRoles;
    const term = roleSearchTerm.toLowerCase();
    return allRoles.filter(
      (r) =>
        r.name.toLowerCase().includes(term) ||
        r.code.toLowerCase().includes(term) ||
        (r.description && r.description.toLowerCase().includes(term))
    );
  }, [allRoles, roleSearchTerm]);

  // ========================================================
  // OVERRIDES STATE & FILTERS
  // ========================================================
  const [overrideMap, setOverrideMap] = useState<Record<string, TOverrideState>>(
    {}
  );
  const [savedOverrideMap, setSavedOverrideMap] = useState<
    Record<string, TOverrideState>
  >({});

  const [permSearchTerm, setPermSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState("ALL");
  const [filterTab, setFilterTab] = useState<TFilterTab>("ALL");

  const syncOverridesFromUser = useCallback(() => {
    if (!activeUser) return;
    const initial: Record<string, TOverrideState> = {};

    if (Array.isArray(activeUser.permissions)) {
      (activeUser.permissions as (TUserPermission | any)[]).forEach((up) => {
        const permId = up.permissionId || up.permission?.id;
        if (permId) {
          if (up.effect === "GRANT" || up.granted === true) {
            initial[permId] = "GRANT";
          } else if (up.effect === "REVOKE" || up.granted === false) {
            initial[permId] = "REVOKE";
          }
        }
      });
    }

    setOverrideMap(initial);
    setSavedOverrideMap(initial);
  }, [activeUser]);

  useEffect(() => {
    if (open) {
      syncOverridesFromUser();
      setPermSearchTerm("");
      setSelectedModule("ALL");
      setFilterTab("ALL");
    } else {
      setOverrideMap({});
      setSavedOverrideMap({});
    }
  }, [open, activeUser?.id, syncOverridesFromUser]);

  const isOverridesDirty = useMemo(() => {
    const keys = new Set([
      ...Object.keys(overrideMap),
      ...Object.keys(savedOverrideMap),
    ]);
    for (const key of keys) {
      const current = overrideMap[key] || "DEFAULT";
      const saved = savedOverrideMap[key] || "DEFAULT";
      if (current !== saved) return true;
    }
    return false;
  }, [overrideMap, savedOverrideMap]);

  // ========================================================
  // REACTIVE ROLE-INHERITANCE ENGINE & FAST MEMOIZED MAP
  // ========================================================
  const { rolePermissionIdMap, rolePermissionCodeMap } = useMemo(() => {
    const idMap = new Map<string, Set<string>>();
    const codeMap = new Map<string, Set<string>>();

    const selectedSet = new Set(selectedRoleIds);
    const activeRolesList = allRoles.filter((r) => selectedSet.has(r.id));

    activeRolesList.forEach((roleObj) => {
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

    return { rolePermissionIdMap: idMap, rolePermissionCodeMap: codeMap };
  }, [selectedRoleIds, allRoles]);

  // High-performance memoized Effective State Map
  // Precomputes all permissions in O(N) instead of recalculating during renders!
  const effectiveStateMap = useMemo(() => {
    const map = new Map<string, TEffectivePermissionState>();
    const isSuperAdmin = !!activeUser?.isSuperAdmin;

    allPermissions.forEach((perm) => {
      const override = overrideMap[perm.id] || "DEFAULT";
      const idRoles = rolePermissionIdMap.get(perm.id);
      const codeRoles = rolePermissionCodeMap.get(perm.code);

      const combinedRoles = Array.from(
        new Set([
          ...(idRoles ? Array.from(idRoles) : []),
          ...(codeRoles ? Array.from(codeRoles) : []),
        ])
      );

      const isInherited = combinedRoles.length > 0 || isSuperAdmin;

      let state: TEffectivePermissionState;

      if (override === "GRANT") {
        state = {
          isActive: true,
          type: "EXPLICIT_GRANT",
          label: "+ FORCED ACTIVE (Custom Override)",
          badgeClass:
            "bg-emerald-600 hover:bg-emerald-600 text-white shadow-xs font-bold",
          borderClass:
            "border-l-4 border-l-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10",
          inheritedRoles: combinedRoles,
        };
      } else if (override === "REVOKE") {
        state = {
          isActive: false,
          type: "EXPLICIT_REVOKE",
          label: "- FORCED BLOCKED (Custom Override)",
          badgeClass:
            "bg-rose-600 hover:bg-rose-600 text-white shadow-xs font-bold",
          borderClass:
            "border-l-4 border-l-rose-500 bg-rose-500/5 dark:bg-rose-500/10",
          inheritedRoles: combinedRoles,
        };
      } else if (isInherited) {
        state = {
          isActive: true,
          type: "INHERITED",
          label: isSuperAdmin
            ? "✓ Active via Super Admin Root"
            : `✓ Active via Role: ${combinedRoles.join(", ")}`,
          badgeClass:
            "bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-medium",
          borderClass:
            "border-l-4 border-l-blue-500 bg-blue-500/5 dark:bg-blue-500/10",
          inheritedRoles: combinedRoles,
        };
      } else {
        state = {
          isActive: false,
          type: "NO_ACCESS",
          label: "✕ Inactive (Role Default)",
          badgeClass:
            "bg-muted text-muted-foreground border border-border/80 font-normal",
          borderClass: "border-l-4 border-l-muted-foreground/30 bg-card",
          inheritedRoles: [],
        };
      }

      map.set(perm.id, state);
    });

    return map;
  }, [
    allPermissions,
    overrideMap,
    rolePermissionIdMap,
    rolePermissionCodeMap,
    activeUser?.isSuperAdmin,
  ]);

  const getEffectiveState = useCallback(
    (permId: string): TEffectivePermissionState => {
      return (
        effectiveStateMap.get(permId) || {
          isActive: false,
          type: "NO_ACCESS",
          label: "✕ Inactive (Role Default)",
          badgeClass: "bg-muted text-muted-foreground border border-border/80 font-normal",
          borderClass: "border-l-4 border-l-muted-foreground/30 bg-card",
          inheritedRoles: [],
        }
      );
    },
    [effectiveStateMap]
  );

  // ========================================================
  // AGGREGATE POSTURE STATISTICS
  // ========================================================
  const stats: TAccessStats = useMemo(() => {
    let explicitGrants = 0;
    let explicitRevokes = 0;
    let roleInheritedCount = 0;
    let totalActive = 0;

    allPermissions.forEach((p) => {
      const state = getEffectiveState(p.id);
      if (state.type === "EXPLICIT_GRANT") explicitGrants++;
      if (state.type === "EXPLICIT_REVOKE") explicitRevokes++;
      if (state.inheritedRoles.length > 0 || activeUser?.isSuperAdmin) {
        roleInheritedCount++;
      }
      if (state.isActive) totalActive++;
    });

    const totalOverrides = explicitGrants + explicitRevokes;
    const noAccessCount = allPermissions.length - totalActive;

    return {
      explicitGrants,
      explicitRevokes,
      totalOverrides,
      roleInheritedCount,
      totalActive,
      noAccessCount,
      totalPermissions: allPermissions.length,
    };
  }, [allPermissions, getEffectiveState, activeUser?.isSuperAdmin]);

  // ========================================================
  // MODULES & FILTERING
  // ========================================================
  const { modules, moduleCountMap } = useMemo(() => {
    const set = new Set<string>();
    const countMap: Record<string, number> = {};

    allPermissions.forEach((p) => {
      const mod = p.module || "General";
      set.add(mod);
      countMap[mod] = (countMap[mod] || 0) + 1;
    });

    return {
      modules: Array.from(set).sort(),
      moduleCountMap: countMap,
    };
  }, [allPermissions]);

  const filteredPermissions = useMemo(() => {
    return allPermissions.filter((perm) => {
      if (selectedModule !== "ALL" && perm.module !== selectedModule) {
        return false;
      }

      if (permSearchTerm.trim()) {
        const term = permSearchTerm.toLowerCase();
        const matchesName = perm.name?.toLowerCase().includes(term);
        const matchesCode = perm.code?.toLowerCase().includes(term);
        const matchesDesc = perm.description?.toLowerCase().includes(term);
        const matchesModule = perm.module?.toLowerCase().includes(term);
        if (!matchesName && !matchesCode && !matchesDesc && !matchesModule) {
          return false;
        }
      }

      const state = getEffectiveState(perm.id);

      if (filterTab === "ACTIVE" && !state.isActive) return false;
      if (
        filterTab === "INHERITED" &&
        state.inheritedRoles.length === 0 &&
        !activeUser?.isSuperAdmin
      ) {
        return false;
      }
      if (
        filterTab === "OVERRIDES" &&
        state.type !== "EXPLICIT_GRANT" &&
        state.type !== "EXPLICIT_REVOKE"
      ) {
        return false;
      }
      if (filterTab === "GRANTS" && state.type !== "EXPLICIT_GRANT") return false;
      if (filterTab === "REVOKES" && state.type !== "EXPLICIT_REVOKE") return false;
      if (filterTab === "NO_ACCESS" && state.isActive) return false;

      return true;
    });
  }, [
    allPermissions,
    selectedModule,
    permSearchTerm,
    filterTab,
    getEffectiveState,
    activeUser?.isSuperAdmin,
  ]);

  const groupedPermissions = useMemo(() => {
    const map = new Map<string, TPermission[]>();
    filteredPermissions.forEach((p) => {
      const mod = p.module || "General";
      if (!map.has(mod)) map.set(mod, []);
      map.get(mod)!.push(p);
    });

    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredPermissions]);

  // ========================================================
  // TAB 3: MATRIX SEARCH & FILTER
  // ========================================================
  const [matrixSearchTerm, setMatrixSearchTerm] = useState("");
  const [matrixModule, setMatrixModule] = useState("ALL");

  const matrixFilteredPermissions = useMemo(() => {
    return allPermissions.filter((perm) => {
      if (matrixModule !== "ALL" && perm.module !== matrixModule) {
        return false;
      }
      if (matrixSearchTerm.trim()) {
        const term = matrixSearchTerm.toLowerCase();
        const matchesName = perm.name?.toLowerCase().includes(term);
        const matchesCode = perm.code?.toLowerCase().includes(term);
        const matchesDesc = perm.description?.toLowerCase().includes(term);
        const matchesModule = perm.module?.toLowerCase().includes(term);
        if (!matchesName && !matchesCode && !matchesDesc && !matchesModule) {
          return false;
        }
      }
      return true;
    });
  }, [allPermissions, matrixModule, matrixSearchTerm]);

  // ========================================================
  // ACTION HANDLERS
  // ========================================================
  const handleSetState = useCallback(
    (permissionId: string, state: TOverrideState) => {
      setOverrideMap((prev) => {
        const next = { ...prev };
        if (state === "DEFAULT") {
          delete next[permissionId];
        } else {
          next[permissionId] = state;
        }
        return next;
      });
    },
    []
  );

  const handleResetAllToRoleDefaults = useCallback(() => {
    setOverrideMap({});
    toast.info("All overrides reset to role defaults. Click Save to persist.");
  }, []);

  const handleResetModuleToDefaults = useCallback(
    (moduleName: string) => {
      const modulePermIds = new Set(
        allPermissions.filter((p) => p.module === moduleName).map((p) => p.id)
      );
      setOverrideMap((prev) => {
        const next = { ...prev };
        modulePermIds.forEach((id) => delete next[id]);
        return next;
      });
      toast.info(`Overrides for "${moduleName}" module reset to role defaults.`);
    },
    [allPermissions]
  );

  const handleBulkGrantModule = useCallback(
    (moduleName: string) => {
      const modulePerms = allPermissions.filter((p) => p.module === moduleName);
      setOverrideMap((prev) => {
        const next = { ...prev };
        modulePerms.forEach((p) => {
          next[p.id] = "GRANT";
        });
        return next;
      });
      toast.success(`Granted all capabilities in "${moduleName}" module.`);
    },
    [allPermissions]
  );

  const handleBulkRevokeModule = useCallback(
    (moduleName: string) => {
      const modulePerms = allPermissions.filter((p) => p.module === moduleName);
      setOverrideMap((prev) => {
        const next = { ...prev };
        modulePerms.forEach((p) => {
          next[p.id] = "REVOKE";
        });
        return next;
      });
      toast.warning(`Revoked all capabilities in "${moduleName}" module.`);
    },
    [allPermissions]
  );

  const handleDiscardAllChanges = useCallback(() => {
    setSelectedRoleIds(savedRoleIds);
    setOverrideMap(savedOverrideMap);
    toast.info("All unsaved role and override changes discarded.");
  }, [savedRoleIds, savedOverrideMap]);

  // Unified Save Mutation
  const handleSaveAll = useCallback(async () => {
    if (!activeUser) return;

    try {
      const promises: Promise<any>[] = [];
      let savedRolesCount = 0;
      let savedOverridesCount = 0;

      if (isRolesDirty) {
        promises.push(
          assignUserRoles({
            id: activeUser.id,
            roleIds: selectedRoleIds,
          }).unwrap()
        );
        savedRolesCount = selectedRoleIds.length;
      }

      if (isOverridesDirty) {
        const overrides = Object.entries(overrideMap)
          .filter(([_, effect]) => effect === "GRANT" || effect === "REVOKE")
          .map(([permissionId, effect]) => ({
            permissionId,
            effect: effect as "GRANT" | "REVOKE",
          }));

        promises.push(
          overrideUserPermissions({
            id: activeUser.id,
            overrides,
          }).unwrap()
        );
        savedOverridesCount = overrides.length;
      }

      if (promises.length === 0) {
        toast.info("No changes to save.");
        return;
      }

      await Promise.all(promises);

      const parts: string[] = [];
      if (isRolesDirty) parts.push(`${savedRolesCount} assigned roles`);
      if (isOverridesDirty)
        parts.push(
          savedOverridesCount > 0
            ? `${savedOverridesCount} explicit overrides`
            : "overrides reset to defaults"
        );

      toast.success(
        `Successfully saved ${parts.join(" and ")} for ${activeUser.firstName} 🎉`
      );
      onSuccess?.();
    } catch (error: any) {
      toast.error(
        error?.data?.message || "Failed to update access control configuration"
      );
    }
  }, [
    activeUser,
    isRolesDirty,
    isOverridesDirty,
    selectedRoleIds,
    overrideMap,
    assignUserRoles,
    overrideUserPermissions,
    onSuccess,
  ]);

  const isSaving = isSavingRoles || isSavingOverrides;
  const hasUnsavedChanges = isRolesDirty || isOverridesDirty;

  return {
    activeUser,
    isUserLoading,
    isRolesLoading,
    isPermsLoading,
    isSaving,
    hasUnsavedChanges,
    // Tab
    activeTab,
    setActiveTab,
    // Roles
    allRoles,
    filteredRoles,
    selectedRoleIds,
    roleSearchTerm,
    setRoleSearchTerm,
    isRolesDirty,
    toggleRole,
    handleSelectAllRoles,
    handleClearAllRoles,
    // Overrides
    allPermissions,
    overrideMap,
    permSearchTerm,
    setPermSearchTerm,
    selectedModule,
    setSelectedModule,
    filterTab,
    setFilterTab,
    modules,
    moduleCountMap,
    filteredPermissions,
    groupedPermissions,
    isOverridesDirty,
    getEffectiveState,
    handleSetState,
    handleResetAllToRoleDefaults,
    handleResetModuleToDefaults,
    handleBulkGrantModule,
    handleBulkRevokeModule,
    // Matrix
    matrixSearchTerm,
    setMatrixSearchTerm,
    matrixModule,
    setMatrixModule,
    matrixFilteredPermissions,
    // Global Actions
    stats,
    handleDiscardAllChanges,
    handleSaveAll,
  };
}
