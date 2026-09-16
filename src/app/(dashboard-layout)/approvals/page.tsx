"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  XCircle,
  FileCheck,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  Plus,
  SlidersHorizontal,
  UserCheck,
  Users,
  Globe,
  HelpCircle,
  ArrowRight,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionHeader from "@/components/shared/SectionHeader";
import SearchInput from "@/components/shared/SearchInput";
import FilterSelect from "@/components/shared/FilterSelect";
import Pagination from "@/components/shared/Pagination";
import ApprovalTable from "@/components/approvals/ApprovalTable";
import ApprovalDecisionModal from "@/components/approvals/ApprovalDecisionModal";
import ApprovalPolicyModal from "@/components/approvals/ApprovalPolicyModal";
import ApprovalPolicyTable from "@/components/approvals/ApprovalPolicyTable";
import { Card } from "@/components/ui/card";
import {
  useGetApprovalRequestsQuery,
  useGetApprovalPoliciesQuery,
  useGetExemptionSummaryQuery,
} from "@/redux/api/approvalApi";
import { usePermission } from "@/hooks/usePermission";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useDebounce } from "@/hooks/useDebounce";
import { TApprovalPolicy, TApprovalRequest, TApprovalStatus } from "@/type";
import { cn } from "@/lib/utils";

function ApprovalsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const scopeParam = searchParams.get("scope");

  const { can } = usePermission();
  const { user } = useCurrentUser();

  const isSuperAdminOrPolicyManager =
    user?.isSuperAdmin || can("approval.manage_policy");

  const isApproverOrSuperAdmin =
    user?.isSuperAdmin || can("approval.view") || can("requisition.approve");

  const [activeTab, setActiveTab] = useState<"inbox" | "policies">(
    tabParam === "policies" && isSuperAdminOrPolicyManager ? "policies" : "inbox"
  );

  const [scope, setScope] = useState<"all" | "my_requests">(() => {
    if (scopeParam === "my_requests") return "my_requests";
    if (scopeParam === "all") return "all";
    return isApproverOrSuperAdmin ? "all" : "my_requests";
  });

  // Sync tab with URL searchParams
  useEffect(() => {
    if (tabParam === "policies" && isSuperAdminOrPolicyManager) {
      setActiveTab("policies");
    } else if (tabParam === "inbox") {
      setActiveTab("inbox");
    }
  }, [tabParam, isSuperAdminOrPolicyManager]);

  // Sync scope with user permissions & URL searchParams
  useEffect(() => {
    if (scopeParam === "my_requests") {
      setScope("my_requests");
    } else if (scopeParam === "all") {
      setScope("all");
    } else if (isApproverOrSuperAdmin) {
      setScope("all");
    } else {
      setScope("my_requests");
    }
  }, [scopeParam, isApproverOrSuperAdmin]);

  const handleTabChange = (tab: "inbox" | "policies") => {
    setActiveTab(tab);
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("tab", tab);
    router.replace(`/approvals?${newParams.toString()}`, { scroll: false });
  };

  const handleScopeChange = (newScope: "all" | "my_requests") => {
    setScope(newScope);
    setPage(1);
    const newParams = new URLSearchParams(searchParams.toString());
    if (newScope === "my_requests") {
      newParams.set("scope", "my_requests");
    } else {
      newParams.delete("scope");
    }
    router.replace(`/approvals?${newParams.toString()}`, { scroll: false });
  };

  // Inbox filters & pagination
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);

  const [status, setStatus] = useState<TApprovalStatus | "">("");
  const [entityType, setEntityType] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Modals
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TApprovalRequest | null>(null);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [selectedPolicyForEdit, setSelectedPolicyForEdit] = useState<TApprovalPolicy | null>(null);

  // Queries
  const { data, isLoading } = useGetApprovalRequestsQuery({
    searchTerm: debouncedSearch || undefined,
    status: (status as TApprovalStatus) || undefined,
    entityType: entityType || undefined,
    requestedById: scope === "my_requests" ? user?.id : undefined,
    page,
    limit,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const { data: policiesData, isLoading: isPoliciesLoading } =
    useGetApprovalPoliciesQuery(undefined, {
      skip: activeTab !== "policies" || !isSuperAdminOrPolicyManager,
    });

  const { data: exemptionSummaryData } = useGetExemptionSummaryQuery(undefined, {
    skip: !isSuperAdminOrPolicyManager,
  });

  const requests = data?.data || [];
  const meta = data?.meta || {
    page: 1,
    limit: 10,
    total: 0,
    totalPage: 1,
  };

  const policies = policiesData?.data || [];
  const exemptionSummary = exemptionSummaryData?.data;

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  const approvedCount = requests.filter((r) => r.status === "APPROVED").length;
  const rejectedCount = requests.filter(
    (r) => r.status === "REJECTED" || r.status === "RETURN_FOR_CORRECTION"
  ).length;

  const handleReview = (req: TApprovalRequest) => {
    setSelectedRequest(req);
    setDecisionModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <SectionHeader
          title="Approvals & Governance Center"
          description="Manage institutional verification inboxes, configure maker-checker policies, and manage person/role exemptions."
        />

        {isSuperAdminOrPolicyManager && activeTab === "policies" && (
          <Button
            onClick={() => {
              setSelectedPolicyForEdit(null);
              setPolicyModalOpen(true);
            }}
            className="flex items-center gap-2 shadow-xs cursor-pointer bg-primary"
          >
            <Plus className="size-4" />
            Add Exemption / Policy
          </Button>
        )}
      </div>

      {/* Tabs Switcher */}
      {isSuperAdminOrPolicyManager && (
        <div className="flex items-center gap-2 border-b pb-2">
          <Button
            type="button"
            variant={activeTab === "inbox" ? "default" : "ghost"}
            size="sm"
            onClick={() => handleTabChange("inbox")}
            className="text-xs gap-1.5 cursor-pointer"
          >
            <CheckSquare className="size-3.5" />
            Approvals Inbox
            {pendingCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white text-primary text-[10px] font-bold">
                {pendingCount}
              </span>
            )}
          </Button>

          <Button
            type="button"
            variant={activeTab === "policies" ? "default" : "ghost"}
            size="sm"
            onClick={() => handleTabChange("policies")}
            className="text-xs gap-1.5 cursor-pointer"
          >
            <SlidersHorizontal className="size-3.5" />
            Policies & Exemptions Rule Engine
          </Button>
        </div>
      )}

      {/* TAB 1: INBOX VIEW */}
      {activeTab === "inbox" && (
        <div className="space-y-6">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 flex items-center gap-4 shadow-xs">
              <div className="size-10 rounded-lg bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-600 shrink-0">
                <Clock className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Pending Review</p>
                <p className="text-xl font-bold text-sky-600 dark:text-sky-400">
                  {pendingCount}
                </p>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-4 shadow-xs">
              <div className="size-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Approved & Executed</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {approvedCount}
                </p>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-4 shadow-xs">
              <div className="size-10 rounded-lg bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600 shrink-0">
                <XCircle className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Rejected / Revision</p>
                <p className="text-xl font-bold text-rose-600 dark:text-rose-400">
                  {rejectedCount}
                </p>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-4 shadow-xs">
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <CheckSquare className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Tracked</p>
                <p className="text-xl font-bold text-foreground">{meta.total}</p>
              </div>
            </Card>
          </div>

          {/* Queue Scope Selector */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-lg border">
              {isApproverOrSuperAdmin && (
                <button
                  type="button"
                  onClick={() => handleScopeChange("all")}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer",
                    scope === "all"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <CheckSquare className="size-3.5 text-primary" />
                  Review Queue (All Requests)
                </button>
              )}

              <button
                type="button"
                onClick={() => handleScopeChange("my_requests")}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer",
                  scope === "my_requests"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <UserCheck className="size-3.5 text-primary" />
                My Submissions
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              {scope === "all"
                ? "Reviewing all requests requiring institutional sign-off."
                : "Tracking status and rejection feedback for your submitted actions."}
            </p>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1">
              <SearchInput
                placeholder="Search by approval # or reason..."
                value={searchTerm}
                onChange={(val) => {
                  setSearchTerm(val);
                  setPage(1);
                }}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Status Filter */}
              <div className="w-full sm:w-44">
                <FilterSelect
                  placeholder="Status"
                  value={status}
                  onChange={(val) => {
                    setStatus(val as TApprovalStatus | "");
                    setPage(1);
                  }}
                  options={[
                    { label: "Pending Action", value: "PENDING" },
                    { label: "Needs Correction", value: "RETURN_FOR_CORRECTION" },
                    { label: "Approved", value: "APPROVED" },
                    { label: "Rejected", value: "REJECTED" },
                    { label: "Cancelled", value: "CANCELLED" },
                  ]}
                  includeAllOption
                  allLabel="All Statuses"
                />
              </div>

              {/* Entity Type Filter */}
              <div className="w-full sm:w-52">
                <FilterSelect
                  placeholder="Entity Type"
                  value={entityType}
                  onChange={(val) => {
                    setEntityType(val);
                    setPage(1);
                  }}
                  options={[
                    { label: "Requisitions", value: "REQUISITION" },
                    { label: "Inventory Items", value: "INVENTORY_ITEM" },
                    { label: "Categories", value: "CATEGORY" },
                    { label: "Stock Adjustments", value: "STOCK_ADJUSTMENT" },
                    { label: "Stock Transfers", value: "STOCK_TRANSFER" },
                    { label: "Departments", value: "DEPARTMENT" },
                    { label: "Buildings & Locations", value: "BUILDING" },
                  ]}
                  includeAllOption
                  allLabel="All Entity Types"
                />
              </div>

              {(searchTerm || status || entityType) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setStatus("");
                    setEntityType("");
                    setPage(1);
                  }}
                  className="gap-1 text-xs"
                >
                  <RotateCcw className="size-3" />
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* Approvals Table */}
          <ApprovalTable
            requests={requests}
            isLoading={isLoading}
            onReview={handleReview}
          />

          {/* Pagination */}
          {meta.totalPage > 1 && (
            <div className="flex justify-end pt-2">
              <Pagination
                currentPage={page}
                totalPages={meta.totalPage}
                totalData={meta.total}
                limit={limit}
                onPageChange={setPage}
                onLimitChange={(l) => {
                  setLimit(l);
                  setPage(1);
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* TAB 2: POLICIES & EXEMPTIONS VIEW */}
      {activeTab === "policies" && isSuperAdminOrPolicyManager && (
        <div className="space-y-6">
          {/* Institutional Status Banner */}
          <div className="p-5 rounded-xl border border-primary/25 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-primary shrink-0" />
                <h3 className="text-sm font-bold text-foreground">
                  Super Admin Approval Rule Engine & Exemption Manager
                </h3>
              </div>
              <p className="text-xs text-muted-foreground max-w-3xl leading-relaxed">
                By default, <strong>all mutations</strong> (creating or editing items, stock, categories, requisitions, departments, etc.) require Super Admin approval. As Super Admin, you can declare exemptions below so specific trusted persons, roles, or actions can save directly without approval.
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => {
                setSelectedPolicyForEdit(null);
                setPolicyModalOpen(true);
              }}
              className="gap-1.5 text-xs bg-primary shrink-0 shadow-xs cursor-pointer"
            >
              <Plus className="size-3.5" />
              Add Exemption / Policy Rule
            </Button>
          </div>

          {/* How It Works Explanatory Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 border-l-4 border-l-blue-500 shadow-xs space-y-2">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-md bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600">
                  <UserCheck className="size-4" />
                </div>
                <h4 className="text-xs font-bold text-foreground">Person Exemption</h4>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Exempt a specific individual user (e.g. Lead Storekeeper) for an action. When this person performs the action, it bypasses Super Admin approval completely.
              </p>
            </Card>

            <Card className="p-4 border-l-4 border-l-purple-500 shadow-xs space-y-2">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-md bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-600">
                  <Users className="size-4" />
                </div>
                <h4 className="text-xs font-bold text-foreground">Role Exemption</h4>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Exempt an entire role (e.g. Branch Manager). Any staff assigned that role can execute the specific operation directly into the database.
              </p>
            </Card>

            <Card className="p-4 border-l-4 border-l-amber-500 shadow-xs space-y-2">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-md bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600">
                  <ShieldAlert className="size-4" />
                </div>
                <h4 className="text-xs font-bold text-foreground">Strict System Default</h4>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                All users and roles without an explicit exemption rule require Super Admin sign-off before any mutation is saved to the database.
              </p>
            </Card>
          </div>

          {/* Exemption Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 flex items-center gap-4 shadow-xs">
              <div className="size-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 shrink-0">
                <UserCheck className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Exempted Persons (Users)</p>
                <p className="text-xl font-bold text-foreground">
                  {exemptionSummary?.exemptedUsersCount || 0}
                </p>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-4 shadow-xs">
              <div className="size-10 rounded-lg bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-600 shrink-0">
                <Users className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Exempted Roles</p>
                <p className="text-xl font-bold text-foreground">
                  {exemptionSummary?.exemptedRolesCount || 0}
                </p>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-4 shadow-xs">
              <div className="size-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 shrink-0">
                <SlidersHorizontal className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Active Policy Rules</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {policies.length}
                </p>
              </div>
            </Card>
          </div>

          {/* Policy Table */}
          <ApprovalPolicyTable
            policies={policies}
            isLoading={isPoliciesLoading}
            onAddPolicy={() => {
              setSelectedPolicyForEdit(null);
              setPolicyModalOpen(true);
            }}
            onEditPolicy={(pol) => {
              setSelectedPolicyForEdit(pol);
              setPolicyModalOpen(true);
            }}
          />
        </div>
      )}

      {/* Decision Review & Resubmit Modal */}
      <ApprovalDecisionModal
        open={decisionModalOpen}
        onOpenChange={setDecisionModalOpen}
        request={selectedRequest}
      />

      {/* Policy Creation / Edit Modal */}
      <ApprovalPolicyModal
        open={policyModalOpen}
        onOpenChange={(val) => {
          if (!val) setSelectedPolicyForEdit(null);
          setPolicyModalOpen(val);
        }}
        policy={selectedPolicyForEdit}
        existingPolicies={policies}
      />
    </div>
  );
}

export default function ApprovalsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-2">
            <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground">Loading Approvals Center...</p>
          </div>
        </div>
      }
    >
      <ApprovalsContent />
    </Suspense>
  );
}
