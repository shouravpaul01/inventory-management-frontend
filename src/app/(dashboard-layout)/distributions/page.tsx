"use client";

import { useState } from "react";
import { Plus, SendHorizontal, PackageCheck, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionHeader from "@/components/shared/SectionHeader";
import SearchInput from "@/components/shared/SearchInput";
import Pagination from "@/components/shared/Pagination";
import DistributionTable from "@/components/distributions/DistributionTable";
import DistributionModal from "@/components/distributions/DistributionModal";
import DeliveryConfirmModal from "@/components/distributions/DeliveryConfirmModal";
import DistributionDetailsModal from "@/components/distributions/DistributionDetailsModal";
import { Card } from "@/components/ui/card";
import { useGetDistributionsQuery } from "@/redux/api/distributionApi";
import { usePermission } from "@/hooks/usePermission";
import { useDebounce } from "@/hooks/useDebounce";
import { TDistribution, TDeliveryStatus } from "@/type";

export default function DistributionsPage() {
  const { can } = usePermission();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);

  const [deliveryStatus, setDeliveryStatus] = useState<TDeliveryStatus | "">("");
  const [issueMode, setIssueMode] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedDistribution, setSelectedDistribution] =
    useState<TDistribution | null>(null);

  const { data, isLoading } = useGetDistributionsQuery({
    searchTerm: debouncedSearch || undefined,
    deliveryStatus: (deliveryStatus as TDeliveryStatus) || undefined,
    issueMode: issueMode || undefined,
    page,
    limit,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const distributions = data?.data || [];
  const meta = data?.meta || {
    page: 1,
    limit: 10,
    total: 0,
    totalPage: 1,
  };

  const pendingCount = distributions.filter(
    (d) => d.deliveryStatus !== "RECEIVED"
  ).length;
  const receivedCount = distributions.filter(
    (d) => d.deliveryStatus === "RECEIVED"
  ).length;

  const handleViewDetails = (dist: TDistribution) => {
    setSelectedDistribution(dist);
    setDetailsModalOpen(true);
  };

  const handleConfirmDelivery = (dist: TDistribution) => {
    setSelectedDistribution(dist);
    setConfirmModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <SectionHeader
          title="Material Distributions & Dispatches"
          description="Warehouse item issues, departmental gate passes, delivery challans, and physical receipt sign-offs."
        />

        {can("distribution.create") && (
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 shadow-xs"
          >
            <Plus className="size-4" />
            Dispatch Supplies
          </Button>
        )}
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-4 shadow-xs">
          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <SendHorizontal className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Dispatches</p>
            <p className="text-xl font-bold text-foreground">{meta.total}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 shadow-xs">
          <div className="size-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Confirmed Received</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {receivedCount}
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 shadow-xs">
          <div className="size-10 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 shrink-0">
            <Clock className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Pending Recipient Sign-Off</p>
            <p className="text-xl font-bold text-amber-700 dark:text-amber-400">
              {pendingCount}
            </p>
          </div>
        </Card>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex-1">
          <SearchInput
            placeholder="Search by distribution # or remarks..."
            value={searchTerm}
            onChange={(val) => {
              setSearchTerm(val);
              setPage(1);
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Delivery Status Filter */}
          <select
            value={deliveryStatus}
            onChange={(e) => {
              setDeliveryStatus(e.target.value as TDeliveryStatus | "");
              setPage(1);
            }}
            aria-label="Filter by Delivery Status"
            className="h-9 px-3 text-xs rounded-md border border-input bg-background focus:outline-hidden focus:ring-1 focus:ring-ring"
          >
            <option value="">All Delivery Statuses</option>
            <option value="PENDING">Pending Acknowledgment</option>
            <option value="DELIVERED">Delivered</option>
            <option value="RECEIVED">Received & Signed</option>
            <option value="REJECTED">Rejected</option>
          </select>

          {/* Allocation Mode Filter */}
          <select
            value={issueMode}
            onChange={(e) => {
              setIssueMode(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by Allocation Mode"
            className="h-9 px-3 text-xs rounded-md border border-input bg-background focus:outline-hidden focus:ring-1 focus:ring-ring"
          >
            <option value="">All Allocation Policies</option>
            <option value="PERMANENT">Permanent Allocation</option>
            <option value="TEMPORARY">Temporary Loan</option>
            <option value="GIFT">Gift Item</option>
          </select>

          {(searchTerm || deliveryStatus || issueMode) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setDeliveryStatus("");
                setIssueMode("");
                setPage(1);
              }}
              className="text-xs h-9"
            >
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* Distribution Table */}
      <DistributionTable
        distributions={distributions}
        isLoading={isLoading}
        onViewDetails={handleViewDetails}
        onConfirmDelivery={handleConfirmDelivery}
      />

      {/* Pagination */}
      {!isLoading && distributions.length > 0 && (
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

      {/* Dispatch Modal */}
      <DistributionModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />

      {/* Delivery Confirmation Modal */}
      <DeliveryConfirmModal
        open={confirmModalOpen}
        onOpenChange={setConfirmModalOpen}
        distribution={selectedDistribution}
      />

      {/* Details Challan Modal */}
      <DistributionDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        distribution={selectedDistribution}
      />
    </div>
  );
}
