"use client";

import { useState } from "react";
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  XCircle,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionHeader from "@/components/shared/SectionHeader";
import SearchInput from "@/components/shared/SearchInput";
import Pagination from "@/components/shared/Pagination";
import ApprovalTable from "@/components/approvals/ApprovalTable";
import ApprovalDecisionModal from "@/components/approvals/ApprovalDecisionModal";
import { Card } from "@/components/ui/card";
import { useGetApprovalRequestsQuery } from "@/redux/api/approvalApi";
import { usePermission } from "@/hooks/usePermission";
import { useDebounce } from "@/hooks/useDebounce";
import { TApprovalRequest, TApprovalStatus } from "@/type";

export default function ApprovalsPage() {
  const { can } = usePermission();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);

  const [status, setStatus] = useState<TApprovalStatus | "">("");
  const [entityType, setEntityType] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TApprovalRequest | null>(null);

  const { data, isLoading } = useGetApprovalRequestsQuery({
    searchTerm: debouncedSearch || undefined,
    status: (status as TApprovalStatus) || undefined,
    entityType: entityType || undefined,
    page,
    limit,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const requests = data?.data || [];
  const meta = data?.meta || {
    page: 1,
    limit: 10,
    total: 0,
    totalPage: 1,
  };

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  const approvedCount = requests.filter((r) => r.status === "APPROVED").length;
  const rejectedCount = requests.filter((r) => r.status === "REJECTED").length;

  const handleReview = (req: TApprovalRequest) => {
    setSelectedRequest(req);
    setDecisionModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <SectionHeader
          title="Multi-Tier Approvals Inbox"
          description="Institutional workflow review inbox. Grant sign-offs, return for corrections, or inspect approval timelines."
        />
      </div>

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
            <p className="text-xs text-muted-foreground font-medium">Approved</p>
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
            <p className="text-xs text-muted-foreground font-medium">Rejected</p>
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

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as TApprovalStatus | "");
              setPage(1);
            }}
            aria-label="Filter by Status"
            className="h-9 px-3 text-xs rounded-md border border-input bg-background focus:outline-hidden focus:ring-1 focus:ring-ring"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending Action</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Entity Type Filter */}
          <select
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by Entity Type"
            className="h-9 px-3 text-xs rounded-md border border-input bg-background focus:outline-hidden focus:ring-1 focus:ring-ring"
          >
            <option value="">All Entity Types</option>
            <option value="Requisition">Requisitions</option>
            <option value="Distribution">Distributions</option>
            <option value="StockTransfer">Stock Transfers</option>
            <option value="StockAdjustment">Stock Adjustments</option>
          </select>

          {(searchTerm || status || entityType) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setStatus("");
                setEntityType("");
                setPage(1);
              }}
              className="text-xs h-9"
            >
              Reset Filters
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
      {!isLoading && requests.length > 0 && (
        <Pagination
          currentPage={page}
          totalPages={meta.totalPage || 1}
          totalData={meta.total || 0}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      )}

      {/* Decision Modal */}
      <ApprovalDecisionModal
        open={decisionModalOpen}
        onOpenChange={setDecisionModalOpen}
        request={selectedRequest}
      />
    </div>
  );
}
