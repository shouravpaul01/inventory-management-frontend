"use client";

import { useState } from "react";
import { Plus, SendHorizontal, PackageCheck, Clock, CheckCircle2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionHeader from "@/components/shared/SectionHeader";
import SearchInput from "@/components/shared/SearchInput";
import FilterSelect from "@/components/shared/FilterSelect";
import Pagination from "@/components/shared/Pagination";
import DistributionTable from "@/components/distributions/DistributionTable";
import DistributionModal from "@/components/distributions/DistributionModal";
import DeliveryConfirmModal from "@/components/distributions/DeliveryConfirmModal";
import DistributionDetailsModal from "@/components/distributions/DistributionDetailsModal";
import StatCard from "@/components/shared/StatCard";
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
        <StatCard
          title="Total Dispatches"
          value={meta.total}
          icon={SendHorizontal}
          variant="primary"
          isLoading={isLoading}
        />

        <StatCard
          title="Confirmed Received"
          value={receivedCount}
          icon={CheckCircle2}
          variant="emerald"
          isLoading={isLoading}
        />

        <StatCard
          title="Pending Recipient Sign-Off"
          value={pendingCount}
          icon={Clock}
          variant="amber"
          isLoading={isLoading}
        />
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

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Delivery Status Filter */}
          <div className="w-full sm:w-52">
            <FilterSelect
              placeholder="Delivery Status"
              value={deliveryStatus}
              onChange={(val) => {
                setDeliveryStatus(val as TDeliveryStatus | "");
                setPage(1);
              }}
              options={[
                { label: "Pending Acknowledgment", value: "PENDING" },
                { label: "Delivered", value: "DELIVERED" },
                { label: "Received & Signed", value: "RECEIVED" },
                { label: "Rejected", value: "REJECTED" },
              ]}
              includeAllOption
              allLabel="All Delivery Statuses"
            />
          </div>

          {/* Allocation Mode Filter */}
          <div className="w-full sm:w-48">
            <FilterSelect
              placeholder="Allocation Policy"
              value={issueMode}
              onChange={(val) => {
                setIssueMode(val);
                setPage(1);
              }}
              options={[
                { label: "Permanent Allocation", value: "PERMANENT" },
                { label: "Temporary Loan", value: "TEMPORARY" },
                { label: "Gift Item", value: "GIFT" },
              ]}
              includeAllOption
              allLabel="All Allocation Policies"
            />
          </div>

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
              className="text-xs h-11 px-3 text-muted-foreground hover:text-foreground gap-1.5 shrink-0"
            >
              <RotateCcw className="size-3.5" />
              <span>Reset</span>
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
