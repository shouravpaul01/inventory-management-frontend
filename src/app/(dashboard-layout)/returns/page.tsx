"use client";

import { useState } from "react";
import { Plus, RotateCcw, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionHeader from "@/components/shared/SectionHeader";
import SearchInput from "@/components/shared/SearchInput";
import Pagination from "@/components/shared/Pagination";
import ReturnTable from "@/components/returns/ReturnTable";
import ReturnModal from "@/components/returns/ReturnModal";
import ReturnDetailsModal from "@/components/returns/ReturnDetailsModal";
import { Card } from "@/components/ui/card";
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
        <Card className="p-4 flex items-center gap-4 shadow-xs">
          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <RotateCcw className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Returns Processed</p>
            <p className="text-xl font-bold text-foreground">{meta.total}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 shadow-xs">
          <div className="size-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Restocked to Inventory</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {returnedCount}
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 shadow-xs">
          <div className="size-10 rounded-lg bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600 shrink-0">
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Overdue / Damaged</p>
            <p className="text-xl font-bold text-rose-600 dark:text-rose-400">
              {overdueCount}
            </p>
          </div>
        </Card>
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

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as TReturnTransactionStatus | "");
              setPage(1);
            }}
            aria-label="Filter by Return Status"
            className="h-9 px-3 text-xs rounded-md border border-input bg-background focus:outline-hidden focus:ring-1 focus:ring-ring"
          >
            <option value="">All Statuses</option>
            <option value="RETURNED">Returned & Restocked</option>
            <option value="PARTIALLY_RETURNED">Partially Returned</option>
            <option value="OVERDUE">Overdue</option>
            <option value="LOST">Lost</option>
          </select>

          {(searchTerm || status) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setStatus("");
                setPage(1);
              }}
              className="text-xs h-9"
            >
              Reset Filters
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
