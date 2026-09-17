"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SearchInput from "@/components/shared/SearchInput";
import FilterSelect from "@/components/shared/FilterSelect";
import { TPermission, TUser } from "@/type";
import {
  TAccessStats,
  TEffectivePermissionState,
  TOverrideState,
} from "./types";
import { Eye, ShieldCheck, X } from "lucide-react";

interface MatrixTabContentProps {
  activeUser: TUser | null;
  overrideMap: Record<string, TOverrideState>;
  stats: TAccessStats;
  selectedRoleIds: string[];
  matrixSearchTerm: string;
  setMatrixSearchTerm: (term: string) => void;
  matrixModule: string;
  setMatrixModule: (mod: string) => void;
  modules: string[];
  moduleCountMap: Record<string, number>;
  matrixFilteredPermissions: TPermission[];
  allPermissionsCount: number;
  getEffectiveState: (permId: string) => TEffectivePermissionState;
}

export default function MatrixTabContent({
  activeUser,
  overrideMap,
  stats,
  selectedRoleIds,
  matrixSearchTerm,
  setMatrixSearchTerm,
  matrixModule,
  setMatrixModule,
  modules,
  moduleCountMap,
  matrixFilteredPermissions,
  allPermissionsCount,
  getEffectiveState,
}: MatrixTabContentProps) {
  const isFiltering =
    matrixSearchTerm.trim() !== "" || matrixModule !== "ALL";

  return (
    <div className="space-y-4">
      {/* Information Guidance Banner */}
      <Card className="border-blue-500/20 bg-blue-500/10 p-3.5 gap-2 shadow-2xs">
        <CardContent className="p-0 flex items-start gap-3">
          <Eye className="size-4 shrink-0 text-blue-600 mt-0.5" />
          <div className="space-y-1">
            <CardTitle className="font-semibold text-xs text-blue-950 dark:text-blue-200">
              Live Institutional Access Verdict
            </CardTitle>
            <CardDescription className="text-[11px] text-blue-900/90 dark:text-blue-300/90 leading-relaxed">
              This matrix renders the definitive security evaluation for every capability.
              It combines <b>Assigned Roles</b> ({selectedRoleIds.length}) +{" "}
              <b>Capability Overrides</b> ({stats.totalOverrides}) to provide the exact audit
              result.
            </CardDescription>
          </div>
        </CardContent>
      </Card>

      {/* Search & Module Filter Toolbar for Auditing */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          <div className="w-full sm:w-80">
            <SearchInput
              value={matrixSearchTerm}
              onChange={setMatrixSearchTerm}
              placeholder="Filter matrix by capability name or code..."
              className="h-10"
            />
          </div>

          <div className="w-full sm:w-56">
            <FilterSelect
              placeholder="Filter by Module"
              value={matrixModule === "ALL" ? "" : matrixModule}
              onChange={(val) => setMatrixModule(val || "ALL")}
              options={modules.map((mod) => ({
                label: `${
                  mod.charAt(0).toUpperCase() + mod.slice(1)
                } (${moduleCountMap[mod] || 0})`,
                value: mod,
              }))}
              includeAllOption
              allLabel={`All Modules (${allPermissionsCount})`}
            />
          </div>

          {isFiltering && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setMatrixSearchTerm("");
                setMatrixModule("ALL");
              }}
              className="h-10 text-xs text-muted-foreground hover:text-foreground shrink-0 gap-1 px-2.5"
            >
              <X className="size-3.5" />
              <span>Clear</span>
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground shrink-0">
          Showing <b>{matrixFilteredPermissions.length}</b> of{" "}
          <b>{allPermissionsCount}</b> capabilities
        </div>
      </div>

      {/* Live Evaluation Table using shadcn Table */}
      <div className="rounded-xl border bg-card shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="text-[11px] font-bold text-muted-foreground uppercase">
                <TableHead className="py-2.5 px-4 font-bold text-muted-foreground">
                  Capability
                </TableHead>
                <TableHead className="py-2.5 px-4 font-bold text-muted-foreground">
                  Module
                </TableHead>
                <TableHead className="py-2.5 px-4 font-bold text-muted-foreground">
                  Base Role Source
                </TableHead>
                <TableHead className="py-2.5 px-4 font-bold text-muted-foreground">
                  Custom Override
                </TableHead>
                <TableHead className="py-2.5 px-4 text-right font-bold text-muted-foreground">
                  Final Verdict
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/60">
              {matrixFilteredPermissions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-12 text-center text-xs text-muted-foreground"
                  >
                    No capabilities match the search criteria.
                  </TableCell>
                </TableRow>
              ) : (
                matrixFilteredPermissions.map((perm) => {
                  const currentOverride = overrideMap[perm.id] || "DEFAULT";
                  const state = getEffectiveState(perm.id);

                  return (
                    <TableRow
                      key={perm.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="py-2.5 px-4">
                        <div className="font-semibold text-foreground text-xs">
                          {perm.name}
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground">
                          {perm.code}
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5 px-4 text-muted-foreground">
                        <Badge variant="outline" className="text-[10px]">
                          {perm.module}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2.5 px-4">
                        {activeUser?.isSuperAdmin ? (
                          <span className="text-emerald-600 font-semibold text-[11px] flex items-center gap-1">
                            <ShieldCheck className="size-3.5" />
                            <span>Super Admin Root</span>
                          </span>
                        ) : state.inheritedRoles.length > 0 ? (
                          <span className="text-blue-600 dark:text-blue-400 font-medium text-[11px]">
                            {state.inheritedRoles.join(", ")}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">
                            None
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-2.5 px-4">
                        {currentOverride === "GRANT" ? (
                          <Badge className="bg-emerald-600 text-white text-[10px] py-0 px-1.5 font-bold">
                            + Force Grant
                          </Badge>
                        ) : currentOverride === "REVOKE" ? (
                          <Badge className="bg-rose-600 text-white text-[10px] py-0 px-1.5 font-bold">
                            - Force Revoke
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">
                            Role Default
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-2.5 px-4 text-right">
                        {state.isActive ? (
                          <Badge
                            variant="secondary"
                            className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 text-[10px] font-bold"
                          >
                            ALLOWED
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-muted-foreground border-border text-[10px]"
                          >
                            DENIED
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
