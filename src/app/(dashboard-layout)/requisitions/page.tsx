"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, FileText, Send, Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionHeader from "@/components/shared/SectionHeader";
import SearchInput from "@/components/shared/SearchInput";
import FilterSelect from "@/components/shared/FilterSelect";
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
  const [requisitionToEdit, setRequisitionToEdit] =
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

  const handleEditRequisition = (req: TRequisition) => {
    setRequisitionToEdit(req);
    setCreateModalOpen(true);
  };

  const handleSubmitDraft = async (req: TRequisition) => {
    try {
      await submitRequisition(req.id).unwrap();
      toast.success(
        req.status === "REJECTED"
          ? `Requisition "${req.requestNumber || req.requisitionNo}" revised and resubmitted for Super Admin approval.`
          : `Requisition "${req.requestNumber || req.requisitionNo}" submitted for approval.`
      );
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
          <Link href="/requisitions/new">
            <Button className="flex items-center gap-2 shadow-xs cursor-pointer">
              <Plus className="size-4" />
              New Requisition
            </Button>
          </Link>
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

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <div className="w-full sm:w-44">
            <FilterSelect
              placeholder="Status"
              value={status}
              onChange={(val) => {
                setStatus(val as TRequisitionStatus | "");
                setPage(1);
              }}
              options={[
                { label: "Draft", value: "DRAFT" },
                { label: "Submitted", value: "SUBMITTED" },
                { label: "Under Review", value: "UNDER_REVIEW" },
                { label: "Approved", value: "APPROVED" },
                { label: "Partially Approved", value: "PARTIALLY_APPROVED" },
                { label: "Rejected", value: "REJECTED" },
                { label: "Cancelled", value: "CANCELLED" },
              ]}
              includeAllOption
              allLabel="All Statuses"
            />
          </div>

          {/* Department Filter */}
          <div className="w-full sm:w-48">
            <FilterSelect
              placeholder="Department"
              value={departmentId}
              onChange={(val) => {
                setDepartmentId(val);
                setPage(1);
              }}
              options={departments.map((dept) => ({
                label: `${dept.name} (${dept.code})`,
                value: dept.id,
              }))}
              includeAllOption
              allLabel="All Departments"
            />
          </div>

          {/* Loan Filter */}
          <div className="w-full sm:w-44">
            <FilterSelect
              placeholder="Request Type"
              value={isTemporary}
              onChange={(val) => {
                setIsTemporary(val);
                setPage(1);
              }}
              options={[
                { label: "Loans Only (Returnable)", value: "true" },
                { label: "Permanent Allocation", value: "false" },
              ]}
              includeAllOption
              allLabel="All Request Types"
            />
          </div>

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
              className="text-xs h-11 px-3 text-muted-foreground hover:text-foreground gap-1.5 shrink-0"
            >
              <RotateCcw className="size-3.5" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* Requisitions Table */}
      <RequisitionTable
        requisitions={requisitions}
        isLoading={isLoading}
        onViewDetails={handleViewDetails}
        onEdit={handleEditRequisition}
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

      {/* Create / Edit Requisition Modal */}
      <RequisitionModal
        open={createModalOpen}
        onOpenChange={(isOpen) => {
          setCreateModalOpen(isOpen);
          if (!isOpen) setRequisitionToEdit(null);
        }}
        requisitionToEdit={requisitionToEdit}
      />

      {/* Requisition Details Modal */}
      <RequisitionDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        requisition={selectedRequisition}
        onEdit={handleEditRequisition}
      />

      {/* Delete / Cancel Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]">
          <DialogHeader className="p-5 pb-3 border-b bg-card shrink-0">
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="size-5" />
              Cancel Draft Requisition
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-5 text-xs text-muted-foreground">
            Are you sure you want to delete draft requisition{" "}
            <strong className="text-foreground">
              "{requisitionToDelete?.requestNumber || requisitionToDelete?.requisitionNo}"
            </strong>
            ? This action cannot be undone.
          </div>

          <DialogFooter className="p-4 border-t bg-card shrink-0">
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
