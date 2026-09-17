"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckSquare, Plus, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import SectionHeader from "@/components/shared/SectionHeader";
import ApprovalsInboxTab from "@/components/approvals/ApprovalsInboxTab";
import ApprovalPoliciesTab from "@/components/approvals/ApprovalPoliciesTab";
import ApprovalDecisionModal from "@/components/approvals/ApprovalDecisionModal";
import ApprovalPolicyModal from "@/components/approvals/ApprovalPolicyModal";
import {
  useGetApprovalRequestsQuery,
  useGetApprovalPoliciesQuery,
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
    tabParam === "policies" && isSuperAdminOrPolicyManager
      ? "policies"
      : "inbox",
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
  const [selectedRequest, setSelectedRequest] =
    useState<TApprovalRequest | null>(null);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [selectedPolicyForEdit, setSelectedPolicyForEdit] =
    useState<TApprovalPolicy | null>(null);

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

  const requests = data?.data || [];
  const meta = data?.meta || {
    page: 1,
    limit: 10,
    total: 0,
    totalPage: 1,
  };

  const policies = policiesData?.data || [];

  // Extract accurate institutional stats directly from backend query metadata
  const pendingCount = meta.pendingCount ?? meta.stats?.pending ?? 0;
  const approvedCount = meta.approvedCount ?? meta.stats?.approved ?? 0;
  const rejectedCount = meta.rejectedCount ?? meta.stats?.rejected ?? 0;

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
          >
            <Plus className="size-4" />
            Add Exemption / Policy
          </Button>
        )}
      </div>

      {/* Tabs Switcher using shadcn Tabs */}
      {isSuperAdminOrPolicyManager ? (
        <Tabs
          value={activeTab}
          onValueChange={(val) => handleTabChange(val as "inbox" | "policies")}
          className="w-full space-y-6"
        >
          <div className="border-b pb-3">
            <TabsList className="tab-list-primary">
              <TabsTrigger value="inbox" className="tab-trigger-primary">
                <CheckSquare className="size-3.5 shrink-0" />
                <span>Approvals Inbox</span>
                {pendingCount > 0 && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px] py-0 px-1.5 h-4 ml-0.5 font-mono font-bold transition-colors",
                      activeTab === "inbox"
                        ? "tab-badge-primary-active"
                        : "bg-sky-500/15 text-sky-700 dark:text-sky-300",
                    )}
                  >
                    {pendingCount}
                  </Badge>
                )}
              </TabsTrigger>

              <TabsTrigger value="policies" className="tab-trigger-primary">
                <SlidersHorizontal className="size-3.5 shrink-0" />
                <span>Policies & Exemptions Rule Engine</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="inbox" className="m-0 focus-visible:outline-none">
            <ApprovalsInboxTab
              requests={requests}
              isLoading={isLoading}
              meta={meta}
              pendingCount={pendingCount}
              approvedCount={approvedCount}
              rejectedCount={rejectedCount}
              scope={scope}
              onScopeChange={handleScopeChange}
              isApproverOrSuperAdmin={isApproverOrSuperAdmin}
              searchTerm={searchTerm}
              onSearchTermChange={(val) => {
                setSearchTerm(val);
                setPage(1);
              }}
              status={status}
              onStatusChange={(val) => {
                setStatus(val);
                setPage(1);
              }}
              entityType={entityType}
              onEntityTypeChange={(val) => {
                setEntityType(val);
                setPage(1);
              }}
              onResetFilters={() => {
                setSearchTerm("");
                setStatus("");
                setEntityType("");
                setPage(1);
              }}
              page={page}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={(l) => {
                setLimit(l);
                setPage(1);
              }}
              onReview={handleReview}
            />
          </TabsContent>

          <TabsContent value="policies" className="m-0 focus-visible:outline-none">
            <ApprovalPoliciesTab
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
          </TabsContent>
        </Tabs>
      ) : (
        <ApprovalsInboxTab
          requests={requests}
          isLoading={isLoading}
          meta={meta}
          pendingCount={pendingCount}
          approvedCount={approvedCount}
          rejectedCount={rejectedCount}
          scope={scope}
          onScopeChange={handleScopeChange}
          isApproverOrSuperAdmin={isApproverOrSuperAdmin}
          searchTerm={searchTerm}
          onSearchTermChange={(val) => {
            setSearchTerm(val);
            setPage(1);
          }}
          status={status}
          onStatusChange={(val) => {
            setStatus(val);
            setPage(1);
          }}
          entityType={entityType}
          onEntityTypeChange={(val) => {
            setEntityType(val);
            setPage(1);
          }}
          onResetFilters={() => {
            setSearchTerm("");
            setStatus("");
            setEntityType("");
            setPage(1);
          }}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
          onReview={handleReview}
        />
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
            <p className="text-xs text-muted-foreground">
              Loading Approvals Center...
            </p>
          </div>
        </div>
      }
    >
      <ApprovalsContent />
    </Suspense>
  );
}
