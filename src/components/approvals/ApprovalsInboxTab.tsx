"use client";

import {
  Clock,
  CheckCircle2,
  XCircle,
  CheckSquare,
  UserCheck,
  RotateCcw,
} from "lucide-react";
import StatCard from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SearchInput from "@/components/shared/SearchInput";
import FilterSelect from "@/components/shared/FilterSelect";
import Pagination from "@/components/shared/Pagination";
import ApprovalTable from "@/components/approvals/ApprovalTable";
import { TApprovalRequest, TApprovalStatus, TMeta } from "@/type";

export interface ApprovalsInboxTabProps {
  requests: TApprovalRequest[];
  isLoading: boolean;
  meta: TMeta;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  scope: "all" | "my_requests";
  onScopeChange: (scope: "all" | "my_requests") => void;
  isApproverOrSuperAdmin: boolean;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  status: TApprovalStatus | "";
  onStatusChange: (status: TApprovalStatus | "") => void;
  entityType: string;
  onEntityTypeChange: (type: string) => void;
  onResetFilters: () => void;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onReview: (request: TApprovalRequest) => void;
}

export default function ApprovalsInboxTab({
  requests,
  isLoading,
  meta,
  pendingCount,
  approvedCount,
  rejectedCount,
  scope,
  onScopeChange,
  isApproverOrSuperAdmin,
  searchTerm,
  onSearchTermChange,
  status,
  onStatusChange,
  entityType,
  onEntityTypeChange,
  onResetFilters,
  page,
  limit,
  onPageChange,
  onLimitChange,
  onReview,
}: ApprovalsInboxTabProps) {
  const statCards = [
    {
      id: "pending",
      title: "Pending Review",
      value: pendingCount,
      icon: Clock,
      variant: "sky" as const,
      description: "Awaiting institutional sign-off",
    },
    {
      id: "approved",
      title: "Approved & Executed",
      value: approvedCount,
      icon: CheckCircle2,
      variant: "emerald" as const,
      description: "Approved & mutation executed",
    },
    {
      id: "rejected",
      title: "Rejected / Revision",
      value: rejectedCount,
      icon: XCircle,
      variant: "rose" as const,
      description: "Rejected or returned for edit",
    },
    {
      id: "total",
      title: "Total Tracked",
      value: meta.total,
      icon: CheckSquare,
      variant: "primary" as const,
      description: "All approval audit records",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <StatCard
            key={card.id}
            title={card.title}
            value={card.value}
            icon={card.icon}
            variant={card.variant}
            description={card.description}
            isLoading={isLoading}
          />
        ))}
      </div>

      {/* Queue Scope Selector using shadcn Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Tabs
          value={scope}
          onValueChange={(val) => onScopeChange(val as "all" | "my_requests")}
          className="w-fit"
        >
          <TabsList className="tab-list-primary">
            {isApproverOrSuperAdmin && (
              <TabsTrigger value="all" className="tab-trigger-primary">
                <CheckSquare className="size-3.5 " />
                <span>Review Queue (All Requests)</span>
              </TabsTrigger>
            )}

            <TabsTrigger value="my_requests" className="tab-trigger-primary">
              <UserCheck className="size-3.5 " />
              <span>My Submissions</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <p className="text-xs text-muted-foreground">
          {scope === "all"
            ? "Reviewing all requests requiring institutional sign-off."
            : "Tracking status and rejection feedback for your submitted actions."}
        </p>
      </div>

      {/* Filters Bar */}
      <div className="p-3 border bg-muted rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-10">
        <div className="flex-1">
          <SearchInput
            placeholder="Search by approval # or reason..."
            value={searchTerm}
            onChange={onSearchTermChange}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <div className="w-full sm:w-44">
            <FilterSelect
              placeholder="Status"
              value={status}
              onChange={(val) => onStatusChange(val as TApprovalStatus | "")}
              options={[
                { label: "Pending Action", value: "PENDING" },
                {
                  label: "Needs Correction",
                  value: "RETURN_FOR_CORRECTION",
                },
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
              onChange={onEntityTypeChange}
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
              onClick={onResetFilters}
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
        onReview={onReview}
      />

      {/* Pagination */}
      {meta.totalPage > 1 && (
        <div className="flex justify-end pt-2">
          <Pagination
            currentPage={page}
            totalPages={meta.totalPage}
            totalData={meta.total}
            limit={limit}
            onPageChange={onPageChange}
            onLimitChange={onLimitChange}
          />
        </div>
      )}
    </div>
  );
}
