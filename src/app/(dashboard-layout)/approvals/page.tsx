"use client";

import { useState } from "react";
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  XCircle,
  FileCheck,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionHeader from "@/components/shared/SectionHeader";
import SearchInput from "@/components/shared/SearchInput";
import FilterSelect from "@/components/shared/FilterSelect";
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
                { label: "Approved", value: "APPROVED" },
                { label: "Rejected", value: "REJECTED" },
                { label: "Cancelled", value: "CANCELLED" },
              ]}
              includeAllOption
              allLabel="All Statuses"
            />
          </div>

          {/* Entity Type Filter */}
          <div className="w-full sm:w-48">
            <FilterSelect
              placeholder="Entity Type"
              value={entityType}
              onChange={(val) => {
                setEntityType(val);
                setPage(1);
              }}
              options={[
                { label: "Requisitions", value: "Requisition" },
                { label: "Distributions", value: "Distribution" },
                { label: "Stock Transfers", value: "StockTransfer" },
                { label: "Stock Adjustments", value: "StockAdjustment" },
              ]}
              includeAllOption
              allLabel="All Entity Types"
            />
          </div>

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
              className="text-xs h-11 px-3 text-muted-foreground hover:text-foreground gap-1.5 shrink-0"
            >
              <RotateCcw className="size-3.5" />
              <span>Reset</span>
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
