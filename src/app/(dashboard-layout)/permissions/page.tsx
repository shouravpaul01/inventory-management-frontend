"use client";

import React, { useState, useMemo } from "react";
import {
  KeyRound,
  Search,
  Copy,
  Check,
  Filter,
  Shield,
  Layers,
  Database,
  RefreshCw,
} from "lucide-react";
import { ProtectedRoute } from "@/components/shared/auth/ProtectedRoute";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useGetAllPermissionsQuery } from "@/redux/api/rbacApi";
import { IPermission } from "@/types";
import { toast } from "sonner";

export default function PermissionsPage() {
  const { data: permsRes, isLoading, isFetching, refetch } = useGetAllPermissionsQuery();
  const permissions: IPermission[] = useMemo(() => permsRes?.data || [], [permsRes]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState<string>("ALL");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grouped" | "table">("grouped");

  // Distinct modules
  const modules = useMemo(() => {
    const set = new Set<string>();
    permissions.forEach((p) => {
      if (p.module) set.add(p.module);
    });
    return Array.from(set).sort();
  }, [permissions]);

  // Filtered permissions
  const filteredPermissions = useMemo(() => {
    return permissions.filter((p) => {
      const matchesSearch =
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        p.module.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesModule = selectedModule === "ALL" || p.module === selectedModule;

      return matchesSearch && matchesModule;
    });
  }, [permissions, searchTerm, selectedModule]);

  // Grouped by module
  const permissionsByModule = useMemo(() => {
    const map: Record<string, IPermission[]> = {};
    filteredPermissions.forEach((p) => {
      const mod = p.module || "GENERAL";
      if (!map[mod]) map[mod] = [];
      map[mod].push(p);
    });
    return map;
  }, [filteredPermissions]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Copied "${code}" to clipboard.`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getModuleColor = (mod: string) => {
    const upper = mod.toUpperCase();
    if (upper.includes("USER") || upper.includes("AUTH")) return "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800";
    if (upper.includes("ROLE") || upper.includes("RBAC")) return "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800";
    if (upper.includes("INVENTORY") || upper.includes("ITEM")) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
    if (upper.includes("STOCK") || upper.includes("LEDGER")) return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800";
    if (upper.includes("REQ") || upper.includes("ORDER")) return "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800";
    if (upper.includes("APPROVAL")) return "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800";
    if (upper.includes("DISTRIBUTION") || upper.includes("HANDOVER")) return "bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800";
    if (upper.includes("RETURN")) return "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800";
    if (upper.includes("LOCATION") || upper.includes("ROOM")) return "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800";
    return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700";
  };

  return (
    <ProtectedRoute permissions={["PERMISSIONS_VIEW", "USERS_VIEW", "ROLES_VIEW"]}>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <PageHeader
          title="System Permissions Catalog"
          description="Comprehensive registry of atomic, granular permissions governing actions, operational policies, and access across the university inventory platform."
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Access Control", href: "/roles" },
            { label: "Permissions" },
          ]}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </PageHeader>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Permissions
              </CardTitle>
              <KeyRound className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{permissions.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Atomic permission codes defined in database
              </p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Functional Modules
              </CardTitle>
              <Layers className="w-4 h-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{modules.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Distinct sub-systems and functional domains
              </p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Filter Results
              </CardTitle>
              <Shield className="w-4 h-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredPermissions.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Permissions matching current search & module
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and View Controls */}
        <Card className="border shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by code (e.g. INVENTORY_CREATE), name, or keyword..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border">
                  <Button
                    variant={viewMode === "grouped" ? "default" : "ghost"}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setViewMode("grouped")}
                  >
                    <Layers className="w-3.5 h-3.5 mr-1" />
                    By Module
                  </Button>
                  <Button
                    variant={viewMode === "table" ? "default" : "ghost"}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setViewMode("table")}
                  >
                    <Database className="w-3.5 h-3.5 mr-1" />
                    All List
                  </Button>
                </div>
              </div>
            </div>

            {/* Module Pills */}
            <div className="flex flex-wrap items-center gap-1.5 mt-4 pt-3 border-t">
              <span className="text-xs font-semibold text-muted-foreground mr-2 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Filter Module:
              </span>
              <Button
                variant={selectedModule === "ALL" ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs px-2.5 rounded-full"
                onClick={() => setSelectedModule("ALL")}
              >
                All ({permissions.length})
              </Button>
              {modules.map((mod) => {
                const count = permissions.filter((p) => p.module === mod).length;
                const isSelected = selectedModule === mod;
                return (
                  <Button
                    key={mod}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs px-2.5 rounded-full"
                    onClick={() => setSelectedModule(mod)}
                  >
                    {mod} ({count})
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Content Area */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-14 bg-muted/30" />
                <CardContent className="h-28" />
              </Card>
            ))}
          </div>
        ) : filteredPermissions.length === 0 ? (
          <Card className="border border-dashed p-12 text-center">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <h3 className="text-lg font-semibold">No permissions found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              No permissions match your search query &quot;{searchTerm}&quot; in the selected module filter.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setSearchTerm("");
                setSelectedModule("ALL");
              }}
            >
              Reset Filters
            </Button>
          </Card>
        ) : viewMode === "grouped" ? (
          /* Grouped View */
          <div className="space-y-6">
            {Object.entries(permissionsByModule).map(([moduleName, perms]) => (
              <Card key={moduleName} className="border shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/20 border-b py-3.5 px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Badge className={getModuleColor(moduleName)} variant="outline">
                        {moduleName}
                      </Badge>
                      <CardTitle className="text-base font-semibold">
                        {moduleName.replace(/_/g, " ")} Permissions
                      </CardTitle>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {perms.length} {perms.length === 1 ? "Permission" : "Permissions"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0 divide-y divide-border/60">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-b">
                    {perms.map((perm) => (
                      <div
                        key={perm.id}
                        className="p-4 hover:bg-muted/10 transition-colors flex flex-col justify-between space-y-3"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <code className="text-xs font-mono font-semibold bg-muted/60 px-2 py-1 rounded border text-foreground select-all break-all">
                              {perm.code}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                              title="Copy code"
                              onClick={() => handleCopyCode(perm.code)}
                            >
                              {copiedCode === perm.code ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          </div>
                          <h4 className="text-sm font-medium mt-2 text-foreground">
                            {perm.name}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {perm.description || "No specific operational description provided."}
                          </p>
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-2 border-t border-border/40">
                          <span className="font-mono text-[10px] text-muted-foreground/70">
                            ID: {perm.id.slice(-6)}
                          </span>
                          <span>Registered in system</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Flat Table View */
          <Card className="border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/40 text-muted-foreground border-b">
                  <tr>
                    <th scope="col" className="px-6 py-3 font-medium">Permission Code</th>
                    <th scope="col" className="px-6 py-3 font-medium">Display Name</th>
                    <th scope="col" className="px-6 py-3 font-medium">Module</th>
                    <th scope="col" className="px-6 py-3 font-medium">Description</th>
                    <th scope="col" className="px-6 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredPermissions.map((perm) => (
                    <tr key={perm.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-foreground whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span>{perm.code}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground whitespace-nowrap">
                        {perm.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getModuleColor(perm.module)} variant="outline">
                          {perm.module}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground max-w-md">
                        {perm.description || "—"}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => handleCopyCode(perm.code)}
                        >
                          {copiedCode === perm.code ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              Copy Code
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  );
}
