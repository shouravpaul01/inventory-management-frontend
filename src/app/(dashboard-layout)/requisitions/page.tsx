"use client";

import { useState } from "react";
import { Plus, FileText, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionHeader from "@/components/shared/SectionHeader";
import SearchInput from "@/components/shared/SearchInput";
import Pagination from "@/components/shared/Pagination";
import RequisitionTable from "@/components/requisitions/RequisitionTable";
import RequisitionModal from "@/components/requisitions/RequisitionModal";
import RequisitionDetailsModal from "@/components/requisitions/RequisitionDetailsModal";
import {
  useGetRequisitionsQuery,
  useSubmitRequisitionMutation,
  useDeleteRequisitionMutation,
} from "@/redux/api/requisitionApi";
import { useGetDepartmentsQuery } from "@/redux/api/departmentApi";
import { usePermission } from "@/hooks/usePermission";
import { useDebounce } from "@/hooks/useDebounce";
import { TRequisition, TRequisitionStatus } from "@/type";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function RequisitionsPage() {
  const { can } = usePermission();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);

  const [status, setStatus] = useState<TRequisitionStatus | "">("");
  const [departmentId, setDepartmentId] = useState("");
  const [isTemporary, setIsTemporary] = useState<string>("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedRequisition, setSelectedRequisition] =
    useState<TRequisition | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [requisitionToDelete, setRequisitionToDelete] =
    useState<TRequisition | null>(null);

  // Reference departments
  const { data: deptsData } = useGetDepartmentsQuery({ limit: 100 });
  const departments = deptsData?.data || [];

  // Requisitions query
  const { data, isLoading } = useGetRequisitionsQuery({
    searchTerm: debouncedSearch || undefined,
    status: (status as TRequisitionStatus) || undefined,
    departmentId: departmentId || undefined,
    isTemporary: isTemporary === "true" ? true : isTemporary === "false" ? false : undefined,
    page,
    limit,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const [submitRequisition] = useSubmitRequisitionMutation();
  const [deleteRequisition, { isLoading: isDeleting }] =
    useDeleteRequisitionMutation();

  const requisitions = data?.data || [];
  const meta = data?.meta || {
    page: 1,
    limit: 10,
    total: 0,
    totalPage: 1,
  };

  const handleViewDetails = (req: TRequisition) => {
    setSelectedRequisition(req);
    setDetailsModalOpen(true);
  };

  const handleSubmitDraft = async (req: TRequisition) => {
    try {
      await submitRequisition(req.id).unwrap();
      toast.success(`Requisition "${req.requestNumber || req.requisitionNo}" submitted for approval.`);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to submit requisition");
    }
  };

  const handleOpenDelete = (req: TRequisition) => {
    setRequisitionToDelete(req);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!requisitionToDelete) return;
    try {
      await deleteRequisition(requisitionToDelete.id).unwrap();
      toast.success(`Requisition "${requisitionToDelete.requestNumber || requisitionToDelete.requisitionNo}" removed.`);
      setDeleteDialogOpen(false);
      setRequisitionToDelete(null);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete requisition");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <SectionHeader
          title="Material Requisitions"
          description="Create, monitor, and track multi-line departmental inventory requests and temporary loans."
        />

        {can("requisition.create") && (
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 shadow-xs"
          >
            <Plus className="size-4" />
            New Requisition
          </Button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex-1">
          <SearchInput
            placeholder="Search by requisition # or purpose..."
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
              setStatus(e.target.value as TRequisitionStatus | "");
              setPage(1);
            }}
            aria-label="Filter by Status"
            className="h-9 px-3 text-xs rounded-md border border-input bg-background focus:outline-hidden focus:ring-1 focus:ring-ring"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="PARTIALLY_APPROVED">Partially Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Department Filter */}
          <select
            value={departmentId}
            onChange={(e) => {
              setDepartmentId(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by Department"
            className="h-9 px-3 text-xs rounded-md border border-input bg-background focus:outline-hidden focus:ring-1 focus:ring-ring"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name} ({dept.code})
              </option>
            ))}
          </select>

          {/* Loan Filter */}
          <select
            value={isTemporary}
            onChange={(e) => {
              setIsTemporary(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by Loan Type"
            className="h-9 px-3 text-xs rounded-md border border-input bg-background focus:outline-hidden focus:ring-1 focus:ring-ring"
          >
            <option value="">All Types</option>
            <option value="true">Loans Only (Returnable)</option>
            <option value="false">Permanent Only</option>
          </select>

          {(searchTerm || status || departmentId || isTemporary) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setStatus("");
                setDepartmentId("");
                setIsTemporary("");
                setPage(1);
              }}
              className="text-xs h-9"
            >
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* Requisitions Table */}
      <RequisitionTable
        requisitions={requisitions}
        isLoading={isLoading}
        onViewDetails={handleViewDetails}
        onSubmitDraft={handleSubmitDraft}
        onCancel={handleOpenDelete}
        onDelete={handleOpenDelete}
      />

      {/* Pagination */}
      {!isLoading && requisitions.length > 0 && (
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

      {/* Create Requisition Modal */}
      <RequisitionModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />

      {/* Requisition Details Modal */}
      <RequisitionDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        requisition={selectedRequisition}
      />

      {/* Delete / Cancel Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="size-5" />
              Cancel Draft Requisition
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete draft requisition{" "}
              <strong className="text-foreground">
                "{requisitionToDelete?.requestNumber || requisitionToDelete?.requisitionNo}"
              </strong>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Keep Requisition
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Requisition"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
