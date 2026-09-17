"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SearchInput from "@/components/shared/SearchInput";
import FilterSelect from "@/components/shared/FilterSelect";
import { TPermission, TUser } from "@/type";
import {
  TAccessStats,
  TEffectivePermissionState,
  TFilterTab,
  TOverrideState,
} from "./types";
import {
  SlidersHorizontal,
  PlusCircle,
  MinusCircle,
  RotateCcw,
  CheckCircle2,
  KeyRound,
  Sparkles,
  Lock,
  Layers,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OverridesTabContentProps {
  activeUser: TUser | null;
  allPermissions: TPermission[];
  overrideMap: Record<string, TOverrideState>;
  stats: TAccessStats;
  permSearchTerm: string;
  setPermSearchTerm: (val: string) => void;
  selectedModule: string;
  setSelectedModule: (val: string) => void;
  filterTab: TFilterTab;
  setFilterTab: (tab: TFilterTab) => void;
  modules: string[];
  moduleCountMap: Record<string, number>;
  groupedPermissions: [string, TPermission[]][];
  isPermsLoading: boolean;
  isUserLoading: boolean;
  getEffectiveState: (permId: string) => TEffectivePermissionState;
  onSetState: (permId: string, state: TOverrideState) => void;
  onBulkGrantModule: (moduleName: string) => void;
  onBulkRevokeModule: (moduleName: string) => void;
  onResetModule: (moduleName: string) => void;
}

export default function OverridesTabContent({
  activeUser,
  allPermissions,
  overrideMap,
  stats,
  permSearchTerm,
  setPermSearchTerm,
  selectedModule,
  setSelectedModule,
  filterTab,
  setFilterTab,
  modules,
  moduleCountMap,
  groupedPermissions,
  isPermsLoading,
  isUserLoading,
  getEffectiveState,
  onSetState,
  onBulkGrantModule,
  onBulkRevokeModule,
  onResetModule,
}: OverridesTabContentProps) {
  const isFiltering =
    permSearchTerm.trim() !== "" ||
    selectedModule !== "ALL" ||
    filterTab !== "ALL";

  const handleResetFilters = () => {
    setPermSearchTerm("");
    setSelectedModule("ALL");
    setFilterTab("ALL");
  };

  return (
    <div className="space-y-4">
      {/* Visual Legend Card - Senior UI Engineering */}
      <Card className="rounded-xl border-border/75 bg-gradient-to-b from-card to-muted/20 shadow-2xs overflow-hidden gap-0 p-3.5">
        <CardHeader className="p-0 pb-2.5 flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <SlidersHorizontal className="size-3.5" />
            </div>
            <div>
              <CardTitle className="text-xs font-bold text-foreground flex items-center gap-2">
                <span>Understanding Capability Overrides</span>
                <Badge
                  variant="outline"
                  className="text-[9px] py-0 px-1.5 font-semibold text-muted-foreground border-border/80"
                >
                  Priority Logic
                </Badge>
              </CardTitle>
              <CardDescription className="text-[11px] text-muted-foreground">
                Fine-tune permissions beyond standard institutional role
                inheritance.
              </CardDescription>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium bg-muted/40 px-2.5 py-1 rounded-full border border-border/60">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>Live Reactive Engine</span>
          </div>
        </CardHeader>

        <CardContent className="p-0 grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-0.5">
          {/* Rule 1: Explicit Grant */}
          <div className="group relative rounded-xl border border-emerald-500/25 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.08] hover:bg-emerald-500/[0.08] dark:hover:bg-emerald-500/[0.12] hover:border-emerald-500/40 p-3 transition-all">
            <div className="flex items-start gap-2.5">
              <div className="size-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 ring-1 ring-emerald-500/25">
                <PlusCircle className="size-4" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-foreground">
                    + Explicit Grant
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                    FORCED ON
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Overrides role absence. Forces capability active for this
                  staff member.
                </p>
              </div>
            </div>
          </div>

          {/* Rule 2: Explicit Revoke */}
          <div className="group relative rounded-xl border border-rose-500/25 bg-rose-500/[0.04] dark:bg-rose-500/[0.08] hover:bg-rose-500/[0.08] dark:hover:bg-rose-500/[0.12] hover:border-rose-500/40 p-3 transition-all">
            <div className="flex items-start gap-2.5">
              <div className="size-7 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 ring-1 ring-rose-500/25">
                <MinusCircle className="size-4" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-foreground">
                    - Explicit Revoke
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-700 dark:text-rose-300">
                    FORCED OFF
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Overrides role grant. Blocks capability even if assigned
                  roles permit it.
                </p>
              </div>
            </div>
          </div>

          {/* Rule 3: Role Default */}
          <div className="group relative rounded-xl border border-border/80 bg-card hover:bg-muted/40 hover:border-primary/40 p-3 transition-all">
            <div className="flex items-start gap-2.5">
              <div className="size-7 rounded-lg bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 flex items-center justify-center shrink-0 ring-1 ring-border transition-colors">
                <RotateCcw className="size-4" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-foreground">
                    Role Default
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                    AUTOMATIC
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Standard posture. Inherits permissions directly from assigned
                  roles.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4 Stat KPI Metric Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
        <Card className="p-3 rounded-xl border bg-muted/30">
          <CardContent className="p-0">
            <span className="text-[10px] text-muted-foreground block font-medium">
              Total Active
            </span>
            <span className="text-lg font-bold text-foreground">
              {activeUser?.isSuperAdmin
                ? "Root Bypass (ALL)"
                : `${stats.totalActive} Active`}
            </span>
          </CardContent>
        </Card>

        <Card className="p-3 rounded-xl border bg-blue-500/5 border-blue-500/20">
          <CardContent className="p-0">
            <span className="text-[10px] text-muted-foreground block font-medium">
              From Assigned Roles
            </span>
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {stats.roleInheritedCount}
            </span>
          </CardContent>
        </Card>

        <Card className="p-3 rounded-xl border bg-emerald-500/5 border-emerald-500/20">
          <CardContent className="p-0">
            <span className="text-[10px] text-muted-foreground block font-medium">
              Explicit Grants (+)
            </span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              +{stats.explicitGrants}
            </span>
          </CardContent>
        </Card>

        <Card className="p-3 rounded-xl border bg-rose-500/5 border-rose-500/20">
          <CardContent className="p-0">
            <span className="text-[10px] text-muted-foreground block font-medium">
              Explicit Revokes (-)
            </span>
            <span className="text-lg font-bold text-rose-600 dark:text-rose-400">
              -{stats.explicitRevokes}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Capability Explorer Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Input */}
        <div className="w-full sm:flex-1">
          <SearchInput
            value={permSearchTerm}
            onChange={setPermSearchTerm}
            placeholder="Search capabilities by name, code, or description..."
          />
        </div>

        {/* Filter by Status/Tabs using FilterSelect */}
        <div className="w-full sm:w-64">
          <FilterSelect
            placeholder="Filter by Status"
            value={filterTab === "ALL" ? "" : filterTab}
            onChange={(val) => setFilterTab((val as TFilterTab) || "ALL")}
            options={[
              {
                label: `Active (${stats.totalActive})`,
                value: "ACTIVE",
                icon: <CheckCircle2 className="size-3.5 text-emerald-600" />,
              },
              {
                label: `From Roles (${stats.roleInheritedCount})`,
                value: "INHERITED",
                icon: <KeyRound className="size-3.5 text-blue-600" />,
              },
              {
                label: `Custom Overrides (${stats.totalOverrides})`,
                value: "OVERRIDES",
                icon: <Sparkles className="size-3.5 text-amber-600" />,
              },
              {
                label: `Explicit Grants (+${stats.explicitGrants})`,
                value: "GRANTS",
                icon: <PlusCircle className="size-3.5 text-emerald-600" />,
              },
              {
                label: `Explicit Revokes (-${stats.explicitRevokes})`,
                value: "REVOKES",
                icon: <MinusCircle className="size-3.5 text-rose-600" />,
              },
              {
                label: `No Access (${stats.noAccessCount})`,
                value: "NO_ACCESS",
                icon: <Lock className="size-3.5 text-muted-foreground" />,
              },
            ]}
            includeAllOption
            allLabel={`All Capabilities (${allPermissions.length})`}
          />
        </div>

        {/* Filter by Module using FilterSelect */}
        <div className="w-full sm:w-56">
          <FilterSelect
            placeholder="Filter by Module"
            value={selectedModule === "ALL" ? "" : selectedModule}
            onChange={(val) => setSelectedModule(val || "ALL")}
            options={modules.map((mod) => ({
              label: `${
                mod.charAt(0).toUpperCase() + mod.slice(1)
              } (${moduleCountMap[mod] || 0})`,
              value: mod,
            }))}
            includeAllOption
            allLabel={`All Modules (${allPermissions.length})`}
          />
        </div>

        {/* Clear Filters button */}
        {isFiltering && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="h-10 text-xs text-muted-foreground hover:text-foreground shrink-0 gap-1 px-2.5"
            title="Clear all active filters"
          >
            <X className="size-3.5" />
            <span>Clear</span>
          </Button>
        )}
      </div>

      {/* Permissions Groups and Cards */}
      {isPermsLoading || isUserLoading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-5 animate-spin text-primary" />
          <span>Loading permissions inventory...</span>
        </div>
      ) : groupedPermissions.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground border border-dashed rounded-xl">
          <span>No permissions match the selected criteria.</span>
          {isFiltering && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs mt-1"
            >
              Reset Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {groupedPermissions.map(([moduleName, perms]) => {
            const moduleOverrides = perms.filter(
              (p) => overrideMap[p.id] && overrideMap[p.id] !== "DEFAULT"
            ).length;

            return (
              <Card
                key={moduleName}
                className="rounded-xl border bg-card shadow-2xs overflow-hidden gap-0 py-0"
              >
                {/* Module Card Header with Bulk Controls */}
                <CardHeader className="p-3 bg-muted/30 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2 space-y-0">
                  <div className="flex items-center gap-2">
                    <Layers className="size-4 text-primary" />
                    <CardTitle className="font-bold text-xs uppercase tracking-wider text-foreground">
                      {moduleName} Module
                    </CardTitle>
                    <Badge
                      variant="secondary"
                      className="text-[10px] py-0 px-1.5 font-mono"
                    >
                      {perms.length} capabilities
                    </Badge>
                    {moduleOverrides > 0 && (
                      <Badge
                        variant="outline"
                        className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] py-0 px-1.5 font-semibold"
                      >
                        {moduleOverrides} overridden
                      </Badge>
                    )}
                  </div>

                  {/* Module Bulk Action Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onBulkGrantModule(moduleName)}
                      className="h-6 text-[10px] font-medium px-2 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
                      title="Force Grant all capabilities in this module"
                    >
                      + Grant Module
                    </Button>
                    <span className="text-muted-foreground/30">•</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onBulkRevokeModule(moduleName)}
                      className="h-6 text-[10px] font-medium px-2 text-rose-700 dark:text-rose-300 hover:bg-rose-500/10"
                      title="Force Revoke all capabilities in this module"
                    >
                      - Revoke Module
                    </Button>
                    <span className="text-muted-foreground/30">•</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onResetModule(moduleName)}
                      className="h-6 text-[10px] font-medium px-2 text-muted-foreground hover:text-foreground"
                      title="Reset all overrides in this module back to role defaults"
                    >
                      Reset Module
                    </Button>
                  </div>
                </CardHeader>

                {/* Permission Items List */}
                <CardContent className="p-0 divide-y divide-border/60">
                  {perms.map((perm) => {
                    const currentOverride = overrideMap[perm.id] || "DEFAULT";
                    const state = getEffectiveState(perm.id);

                    return (
                      <div
                        key={perm.id}
                        className={cn(
                          "p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors",
                          state.borderClass
                        )}
                      >
                        {/* Capability Details */}
                        <div className="space-y-1 min-w-0 max-w-xl">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-foreground">
                              {perm.name}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground bg-muted/80 px-1.5 py-0.2 rounded border border-border/60">
                              {perm.code}
                            </span>

                            {/* Reactive Visual Status Badge */}
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-[10px] py-0 px-2",
                                state.badgeClass
                              )}
                            >
                              {state.label}
                            </Badge>
                          </div>

                          {perm.description && (
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              {perm.description}
                            </p>
                          )}
                        </div>

                        {/* Accessible 3-Way Segmented Control */}
                        <div
                          role="group"
                          aria-label={`Override setting for ${perm.name}`}
                          className="flex items-center shrink-0 self-end sm:self-auto bg-muted/70 p-0.5 rounded-lg border border-border"
                        >
                          <button
                            type="button"
                            aria-pressed={currentOverride === "DEFAULT"}
                            onClick={() => onSetState(perm.id, "DEFAULT")}
                            className={cn(
                              "text-[10px] font-semibold px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer",
                              currentOverride === "DEFAULT"
                                ? "bg-background text-foreground shadow-xs font-bold"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <span>Role Default</span>
                          </button>

                          <button
                            type="button"
                            aria-pressed={currentOverride === "GRANT"}
                            onClick={() => onSetState(perm.id, "GRANT")}
                            className={cn(
                              "text-[10px] font-semibold px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer",
                              currentOverride === "GRANT"
                                ? "bg-emerald-600 text-white shadow-xs font-bold"
                                : "text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
                            )}
                          >
                            <PlusCircle className="size-3" />
                            <span>+ Grant</span>
                          </button>

                          <button
                            type="button"
                            aria-pressed={currentOverride === "REVOKE"}
                            onClick={() => onSetState(perm.id, "REVOKE")}
                            className={cn(
                              "text-[10px] font-semibold px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer",
                              currentOverride === "REVOKE"
                                ? "bg-rose-600 text-white shadow-xs font-bold"
                                : "text-rose-700 dark:text-rose-400 hover:bg-rose-500/10"
                            )}
                          >
                            <MinusCircle className="size-3" />
                            <span>- Revoke</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
