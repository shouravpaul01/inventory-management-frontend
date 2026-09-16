"use client";

import { useState } from "react";
import { Plus, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionHeader from "@/components/shared/SectionHeader";
import SearchInput from "@/components/shared/SearchInput";
import Pagination from "@/components/shared/Pagination";
import DepartmentTable from "@/components/departments/DepartmentTable";
import DepartmentModal from "@/components/departments/DepartmentModal";
import {
  useGetDepartmentsQuery,
  useDeleteDepartmentMutation,
} from "@/redux/api/departmentApi";
import { usePermission } from "@/hooks/usePermission";
import { useDebounce } from "@/hooks/useDebounce";
import { TDepartment } from "@/type";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function DepartmentsPage() {
  const { can } = usePermission();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<TDepartment | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const { data, isLoading } = useGetDepartmentsQuery({
    searchTerm: debouncedSearch || undefined,
    page,
    limit,
  });

  const [deleteDepartment, { isLoading: isDeleting }] =
    useDeleteDepartmentMutation();

  const departments = data?.data || [];
  const meta = data?.meta || {
    page: 1,
    limit: 10,
    total: 0,
    totalPage: 1,
  };

  const handleOpenCreate = () => {
    setSelectedDept(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (dept: TDepartment) => {
    setSelectedDept(dept);
    setModalOpen(true);
  };

  const handleOpenDelete = (id: string, name: string) => {
    setDeptToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deptToDelete) return;
    try {
      await deleteDepartment(deptToDelete.id).unwrap();
      toast.success(`Department "${deptToDelete.name}" deleted successfully.`);
      setDeleteDialogOpen(false);
      setDeptToDelete(null);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete department");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <SectionHeader
          title="Department Directory"
          description="Manage academic and administrative departments for item allocation and approval routing."
        />

        {can("department.create") && (
          <Button onClick={handleOpenCreate} className="shrink-0 gap-1.5 shadow-xs">
            <Plus className="size-4" />
            <span>Add Department</span>
          </Button>
        )}
      </div>

      {/* Search Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="w-full sm:max-w-sm">
          <SearchInput
            value={searchTerm}
            onChange={(val) => {
              setSearchTerm(val);
              setPage(1);
            }}
            placeholder="Search departments by name or code..."
          />
        </div>
      </div>

      {/* Departments Table */}
      <DepartmentTable
        departments={departments}
        isLoading={isLoading}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
      />

      {/* Pagination */}
      {meta.total > 0 && (
        <Pagination
          currentPage={meta.page}
          totalPages={meta.totalPage}
          totalData={meta.total}
          limit={meta.limit}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      )}

      {/* Create / Edit Modal */}
      <DepartmentModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        department={selectedDept}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]">
          <DialogHeader className="p-5 pb-3 border-b bg-card shrink-0">
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Building2 className="size-5" />
              Confirm Department Deletion
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-5 text-xs text-muted-foreground">
            Are you sure you want to delete{" "}
            <strong className="text-foreground">
              "{deptToDelete?.name}"
            </strong>
            ? This action cannot be undone and will affect associated users and
            locations.
          </div>

          <DialogFooter className="p-4 border-t bg-card shrink-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Yes, Delete Department"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
