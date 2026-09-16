"use client";

import { useState } from "react";
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
import { TApprovalPolicy } from "@/type";
import {
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Pencil,
  UserCheck,
  Users,
  Globe,
  Loader2,
  Plus,
  Search,
  Filter,
} from "lucide-react";
import { useDeletePolicyMutation } from "@/redux/api/approvalApi";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ApprovalPolicyTableProps {
  policies: TApprovalPolicy[];
  isLoading: boolean;
  onAddPolicy?: () => void;
  onEditPolicy?: (policy: TApprovalPolicy) => void;
}

export default function ApprovalPolicyTable({
  policies,
  isLoading,
  onAddPolicy,
  onEditPolicy,
}: ApprovalPolicyTableProps) {
  const [deletePolicy, { isLoading: isDeleting }] = useDeletePolicyMutation();
  const [filterScope, setFilterScope] = useState<"ALL" | "USER" | "ROLE" | "SYSTEM">("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPolicies = policies.filter((p) => {
    if (filterScope !== "ALL" && p.scope !== filterScope) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const permName = p.permission?.name?.toLowerCase() || "";
      const permCode = (p.permission?.code || p.permissionId || "").toLowerCase();
      const userName = p.user ? `${p.user.firstName} ${p.user.lastName || ""}`.toLowerCase() : "";
      const userEmail = p.user?.email?.toLowerCase() || "";
      const roleName = p.role?.name?.toLowerCase() || "";
      if (
        !permName.includes(term) &&
        !permCode.includes(term) &&
        !userName.includes(term) &&
        !userEmail.includes(term) &&
        !roleName.includes(term)
      ) {
        return false;
      }
    }
    return true;
  });

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove this policy/exemption?`)) return;

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
          <Badge variant="outline" className="text-[10px] gap-1 border-blue-200 text-blue-700 dark:text-blue-300">
            <UserCheck className="size-2.5" /> Person
          </Badge>
        );
      case "ROLE":
        return (
          <Badge variant="outline" className="text-[10px] gap-1 border-purple-200 text-purple-700 dark:text-purple-300">
            <Users className="size-2.5" /> Role
          </Badge>
        );
      case "SYSTEM":
      default:
        return (
          <Badge variant="outline" className="text-[10px] gap-1 border-slate-200 text-slate-700 dark:text-slate-300">
            <Globe className="size-2.5" /> System-Wide
          </Badge>
        );
    }
  };

  const userPoliciesCount = policies.filter((p) => p.scope === "USER").length;
  const rolePoliciesCount = policies.filter((p) => p.scope === "ROLE").length;
  const systemPoliciesCount = policies.filter((p) => p.scope === "SYSTEM").length;

  return (
    <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
      {/* Controls Bar */}
      <div className="p-3 border-b bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            type="button"
            variant={filterScope === "ALL" ? "default" : "outline"}
            size="xs"
            onClick={() => setFilterScope("ALL")}
            className="text-xs h-7"
          >
            All Rules ({policies.length})
          </Button>
          <Button
            type="button"
            variant={filterScope === "USER" ? "default" : "outline"}
            size="xs"
            onClick={() => setFilterScope("USER")}
            className="text-xs h-7 gap-1"
          >
            <UserCheck className="size-3 text-blue-500" />
            Persons ({userPoliciesCount})
          </Button>
          <Button
            type="button"
            variant={filterScope === "ROLE" ? "default" : "outline"}
            size="xs"
            onClick={() => setFilterScope("ROLE")}
            className="text-xs h-7 gap-1"
          >
            <Users className="size-3 text-purple-500" />
            Roles ({rolePoliciesCount})
          </Button>
          <Button
            type="button"
            variant={filterScope === "SYSTEM" ? "default" : "outline"}
            size="xs"
            onClick={() => setFilterScope("SYSTEM")}
            className="text-xs h-7 gap-1"
          >
            <Globe className="size-3 text-emerald-500" />
            System ({systemPoliciesCount})
          </Button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search target or action..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-7 text-xs"
            />
          </div>
          {onAddPolicy && (
            <Button
              type="button"
              size="xs"
              onClick={onAddPolicy}
              className="h-7 text-xs bg-primary gap-1 shrink-0"
            >
              <Plus className="size-3" />
              New Rule
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="font-semibold text-xs py-3.5">Action / Permission</TableHead>
              <TableHead className="font-semibold text-xs py-3.5">Scope</TableHead>
              <TableHead className="font-semibold text-xs py-3.5">Target Entity</TableHead>
              <TableHead className="font-semibold text-xs py-3.5 text-center">Requirement</TableHead>
              <TableHead className="font-semibold text-xs py-3.5 text-center">Tiers</TableHead>
              <TableHead className="font-semibold text-xs py-3.5 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableLoading colSpan={6} />
            ) : filteredPolicies.length === 0 ? (
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
              filteredPolicies.map((policy) => {
                const isExempt = policy.requirement === "NOT_REQUIRED";
                const targetText =
                  policy.scope === "USER" && policy.user
                    ? `${policy.user.firstName} ${policy.user.lastName || ""} (${policy.user.employeeId || policy.user.email})`
                    : policy.scope === "ROLE" && policy.role
                    ? `${policy.role.name} (${policy.role.code})`
                    : "All Users / System-wide";

                return (
                  <TableRow key={policy.id} className="hover:bg-muted/30 transition-colors">
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
                      <span className="font-medium text-foreground">{targetText}</span>
                    </TableCell>

                    <TableCell className="py-3 text-center">
                      {isExempt ? (
                        <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600 text-[10px] gap-1">
                          <ShieldCheck className="size-2.5" /> Exempted (Direct Save)
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] gap-1">
                          <ShieldAlert className="size-2.5" /> Approval Required
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="py-3 text-center text-xs font-mono">
                      {isExempt ? "0 (Direct)" : `${policy.approvalLevelCount} level(s)`}
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
                          onClick={() => handleDelete(policy.id, policy.permission?.name || "")}
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
  );
}
