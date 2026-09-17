"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import TableEmpty from "@/components/shared/TableEmpty";
import TableLoading from "@/components/shared/TableLoading";
import SearchInput from "@/components/shared/SearchInput";
import { TApprovalPolicy } from "@/type";
import {
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Pencil,
  UserCheck,
  Users,
  Globe,
  Plus,
} from "lucide-react";
import {
  useDeletePolicyMutation,
  useGetApprovalPoliciesQuery,
} from "@/redux/api/approvalApi";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";

interface ApprovalPolicyTableProps {
  policies?: TApprovalPolicy[];
  isLoading?: boolean;
  onAddPolicy?: () => void;
  onEditPolicy?: (policy: TApprovalPolicy) => void;
}

export default function ApprovalPolicyTable({
  policies: propPolicies,
  isLoading: propIsLoading = false,
  onAddPolicy,
  onEditPolicy,
}: ApprovalPolicyTableProps) {
  const [deletePolicy, { isLoading: isDeleting }] = useDeletePolicyMutation();
  const [filterScope, setFilterScope] = useState<
    "ALL" | "USER" | "ROLE" | "SYSTEM"
  >("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);

  // 1. Direct Query Filter:
  // Build query params based on selected filterScope and search term
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      limit: 200,
      sortBy: "createdAt",
      sortOrder: "desc",
    };
    if (filterScope !== "ALL") {
      params.scope = filterScope;
    }
    if (debouncedSearch.trim()) {
      params.searchTerm = debouncedSearch.trim();
    }
    return params;
  }, [filterScope, debouncedSearch]);

  // Execute direct query with filter parameters
  const {
    data: filteredData,
    isLoading: isQueryLoading,
    isFetching,
  } = useGetApprovalPoliciesQuery(queryParams);

  // Unfiltered baseline query for tab counts
  const { data: allPoliciesData } = useGetApprovalPoliciesQuery(undefined);
  const allPolicies = propPolicies || allPoliciesData?.data || [];

  const policies = filteredData?.data || [];
  const isLoading =
    isQueryLoading || isFetching || (propIsLoading && !filteredData);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove this policy/exemption?`))
      return;

    try {
      await deletePolicy(id).unwrap();
      toast.success("Policy removed successfully.");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to remove policy");
    }
  };

  const getScopeBadge = (scope: string) => {
    switch (scope) {
      case "USER":
        return (
          <Badge
            variant="outline"
            className="text-[10px] gap-1 border-blue-200 text-blue-700 dark:text-blue-300"
          >
            <UserCheck className="size-2.5" /> Person
          </Badge>
        );
      case "ROLE":
        return (
          <Badge
            variant="outline"
            className="text-[10px] gap-1 border-purple-200 text-purple-700 dark:text-purple-300"
          >
            <Users className="size-2.5" /> Role
          </Badge>
        );
      case "SYSTEM":
      default:
        return (
          <Badge
            variant="outline"
            className="text-[10px] gap-1 border-slate-200 text-slate-700 dark:text-slate-300"
          >
            <Globe className="size-2.5" /> System-Wide
          </Badge>
        );
    }
  };

  const userPoliciesCount = allPolicies.filter(
    (p) => p.scope === "USER",
  ).length;
  const rolePoliciesCount = allPolicies.filter(
    (p) => p.scope === "ROLE",
  ).length;
  const systemPoliciesCount = allPolicies.filter(
    (p) => p.scope === "SYSTEM",
  ).length;
  const totalPoliciesCount = allPolicies.length;

  return (
    <>
      {/* Controls Bar */}
      <div className="p-3 border bg-muted rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-10">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search target or action..."
          className="max-w-[400px]!"
        />
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            type="button"
            variant={filterScope === "ALL" ? "default" : "outline"}
            onClick={() => setFilterScope("ALL")}
          >
            All Rules ({totalPoliciesCount})
          </Button>
          <Button
            type="button"
            variant={filterScope === "USER" ? "default" : "outline"}
            onClick={() => setFilterScope("USER")}
            className="text-xs gap-1"
          >
            <UserCheck className="size-3 text-blue-500" />
            Persons ({userPoliciesCount})
          </Button>
          <Button
            type="button"
            variant={filterScope === "ROLE" ? "default" : "outline"}
            onClick={() => setFilterScope("ROLE")}
          >
            <Users className="size-3 text-purple-500" />
            Roles ({rolePoliciesCount})
          </Button>
          <Button
            type="button"
            variant={filterScope === "SYSTEM" ? "default" : "outline"}
            onClick={() => setFilterScope("SYSTEM")}
          >
            <Globe className="size-3 text-emerald-500" />
            System ({systemPoliciesCount})
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted ">
                <TableHead className="font-semibold text-xs py-3.5">
                  Action / Permission
                </TableHead>
                <TableHead className="font-semibold text-xs py-3.5">
                  Scope
                </TableHead>
                <TableHead className="font-semibold text-xs py-3.5">
                  Target Entity
                </TableHead>
                <TableHead className="font-semibold text-xs py-3.5 text-center">
                  Requirement
                </TableHead>
                <TableHead className="font-semibold text-xs py-3.5 text-center">
                  Tiers
                </TableHead>
                <TableHead className="font-semibold text-xs py-3.5 text-right">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableLoading colSpan={6} />
              ) : policies.length === 0 ? (
                <TableEmpty
                  colSpan={6}
                  message={
                    searchTerm || filterScope !== "ALL"
                      ? "No policies or exemptions match your filter criteria."
                      : "No custom policies or exemptions configured."
                  }
                  description={
                    searchTerm || filterScope !== "ALL"
                      ? "Try clearing your search term or switching scopes."
                      : "By default, the institutional Strict Maker-Checker rule applies to all mutations. Click 'Add Exemption / Policy Rule' to configure custom rules."
                  }
                />
              ) : (
                policies.map((policy) => {
                  const isExempt = policy.requirement === "NOT_REQUIRED";
                  const targetText =
                    policy.scope === "USER" && policy.user
                      ? `${policy.user.firstName} ${policy.user.lastName || ""} (${policy.user.employeeId || policy.user.email})`
                      : policy.scope === "ROLE" && policy.role
                        ? `${policy.role.name} (${policy.role.code})`
                        : "All Users / System-wide";

                  return (
                    <TableRow
                      key={policy.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="py-3 font-medium text-xs">
                        <div className="font-semibold text-foreground">
                          {policy.permission?.name || policy.permissionId}
                        </div>
                        <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                          {policy.permission?.code || policy.permissionId}
                        </div>
                      </TableCell>

                      <TableCell className="py-3">
                        {getScopeBadge(policy.scope)}
                      </TableCell>

                      <TableCell className="py-3 text-xs">
                        <span className="font-medium text-foreground">
                          {targetText}
                        </span>
                      </TableCell>

                      <TableCell className="py-3 text-center">
                        {isExempt ? (
                          <Badge
                            variant="default"
                            className="bg-emerald-600 hover:bg-emerald-600 text-[10px] gap-1"
                          >
                            <ShieldCheck className="size-2.5" /> Exempted
                            (Direct Save)
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] gap-1"
                          >
                            <ShieldAlert className="size-2.5" /> Approval
                            Required
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="py-3 text-center text-xs font-mono">
                        {isExempt
                          ? "0 (Direct)"
                          : `${policy.approvalLevelCount} level(s)`}
                      </TableCell>

                      <TableCell className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {onEditPolicy && (
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              title="Edit this policy / exemption"
                              onClick={() => onEditPolicy(policy)}
                              className="text-primary hover:bg-primary/10 cursor-pointer"
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            title="Delete this policy"
                            disabled={isDeleting}
                            onClick={() =>
                              handleDelete(
                                policy.id,
                                policy.permission?.name || "",
                              )
                            }
                            className="text-destructive hover:bg-destructive/10 cursor-pointer"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
