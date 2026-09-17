"use client";

import { useState } from "react";
import { Plus, RotateCcw, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionHeader from "@/components/shared/SectionHeader";
import SearchInput from "@/components/shared/SearchInput";
import FilterSelect from "@/components/shared/FilterSelect";
import Pagination from "@/components/shared/Pagination";
import ReturnTable from "@/components/returns/ReturnTable";
import ReturnModal from "@/components/returns/ReturnModal";
import ReturnDetailsModal from "@/components/returns/ReturnDetailsModal";
import StatCard from "@/components/shared/StatCard";
import { useGetReturnsQuery } from "@/redux/api/returnApi";
import { usePermission } from "@/hooks/usePermission";
import { useDebounce } from "@/hooks/useDebounce";
import { TReturn, TReturnTransactionStatus } from "@/type";

export default function ReturnsPage() {
  const { can } = usePermission();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);

  const [status, setStatus] = useState<TReturnTransactionStatus | "">("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<TReturn | null>(null);

  const { data, isLoading } = useGetReturnsQuery({
    searchTerm: debouncedSearch || undefined,
    status: (status as TReturnTransactionStatus) || undefined,
    page,
    limit,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const returns = data?.data || [];
  const meta = data?.meta || {
    page: 1,
    limit: 10,
    total: 0,
    totalPage: 1,
  };

  const returnedCount = returns.filter((r) => r.status === "RETURNED").length;
  const overdueCount = returns.filter((r) => r.status === "OVERDUE").length;

  const handleViewDetails = (ret: TReturn) => {
    setSelectedReturn(ret);
    setDetailsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <SectionHeader
          title="Returns & Restocking Management"
          description="Log equipment returns, inspect condition, and restock items back into inventory locations."
        />

        {can("return.create") && (
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 shadow-xs"
          >
            <Plus className="size-4" />
            Process Return
          </Button>
        )}
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Returns Processed"
          value={meta.total}
          icon={RotateCcw}
          variant="primary"
          isLoading={isLoading}
        />

        <StatCard
          title="Restocked to Inventory"
          value={returnedCount}
          icon={CheckCircle2}
          variant="emerald"
          isLoading={isLoading}
        />

        <StatCard
          title="Overdue / Damaged"
          value={overdueCount}
          icon={AlertTriangle}
          variant="rose"
          isLoading={isLoading}
        />
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex-1">
          <SearchInput
            placeholder="Search by return # or remarks..."
            value={searchTerm}
            onChange={(val) => {
              setSearchTerm(val);
              setPage(1);
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <div className="w-full sm:w-56">
            <FilterSelect
              placeholder="Return Status"
              value={status}
              onChange={(val) => {
                setStatus(val as TReturnTransactionStatus | "");
                setPage(1);
              }}
              options={[
                { label: "Returned & Restocked", value: "RETURNED" },
                { label: "Partially Returned", value: "PARTIALLY_RETURNED" },
                { label: "Overdue", value: "OVERDUE" },
                { label: "Lost", value: "LOST" },
              ]}
              includeAllOption
              allLabel="All Return Statuses"
            />
          </div>

          {(searchTerm || status) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setStatus("");
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

      {/* Return Table */}
      <ReturnTable
        returns={returns}
        isLoading={isLoading}
        onViewDetails={handleViewDetails}
      />

      {/* Pagination */}
      {!isLoading && returns.length > 0 && (
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

      {/* Process Return Modal */}
      <ReturnModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />

      {/* Return Details Modal */}
      <ReturnDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        returnRecord={selectedReturn}
      />
    </div>
  );
}
