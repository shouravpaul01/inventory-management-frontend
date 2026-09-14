"use client";

import { useState } from "react";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionHeader from "@/components/shared/SectionHeader";
import SearchInput from "@/components/shared/SearchInput";
import Pagination from "@/components/shared/Pagination";
import UserTable from "@/components/users/UserTable";
import UserModal from "@/components/users/UserModal";
import UserStatusModal from "@/components/users/UserStatusModal";
import UserPermissionsModal from "@/components/users/UserPermissionsModal";
import { useGetUsersQuery } from "@/redux/api/userApi";
import { useGetDepartmentsQuery } from "@/redux/api/departmentApi";
import { usePermission } from "@/hooks/usePermission";
import { useDebounce } from "@/hooks/useDebounce";
import { TUser, TUserStatus } from "@/type";

export default function UsersPage() {
  const { can } = usePermission();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);

  const [departmentId, setDepartmentId] = useState("");
  const [status, setStatus] = useState<TUserStatus | "">("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Modals state
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<TUser | null>(null);

  const { data: deptData } = useGetDepartmentsQuery({ limit: 100 });
  const departments = deptData?.data || [];

  const { data, isLoading } = useGetUsersQuery({
    searchTerm: debouncedSearch || undefined,
    departmentId: departmentId || undefined,
    status: (status as TUserStatus) || undefined,
    page,
    limit,
  });

  const users = data?.data || [];
  const meta = data?.meta || {
    page: 1,
    limit: 10,
    total: 0,
    totalPage: 1,
  };

  const handleOpenCreate = () => {
    setSelectedUser(null);
    setUserModalOpen(true);
  };

  const handleOpenEdit = (user: TUser) => {
    setSelectedUser(user);
    setUserModalOpen(true);
  };

  const handleOpenStatus = (user: TUser) => {
    setSelectedUser(user);
    setStatusModalOpen(true);
  };

  const handleOpenPermissions = (user: TUser) => {
    setSelectedUser(user);
    setPermissionsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <SectionHeader
          title="User & Staff Directory"
          description="Manage institutional faculty, department heads, storekeepers, and permission assignments."
        />

        {can("user.create") && (
          <Button onClick={handleOpenCreate} className="shrink-0 gap-1.5 shadow-xs">
            <Plus className="size-4" />
            <span>Add Staff Account</span>
          </Button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="w-full sm:max-w-xs">
          <SearchInput
            value={searchTerm}
            onChange={(val) => {
              setSearchTerm(val);
              setPage(1);
            }}
            placeholder="Search by name, email, or employee ID..."
          />
        </div>

        <select
          aria-label="Filter by Department"
          value={departmentId}
          onChange={(e) => {
            setDepartmentId(e.target.value);
            setPage(1);
          }}
          className="h-11 px-3 text-xs rounded-md border border-input bg-background w-full sm:w-48"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by Status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as any);
            setPage(1);
          }}
          className="h-11 px-3 text-xs rounded-md border border-input bg-background w-full sm:w-36"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {/* User Table */}
      <UserTable
        users={users}
        isLoading={isLoading}
        onEdit={handleOpenEdit}
        onChangeStatus={handleOpenStatus}
        onOverridePermissions={handleOpenPermissions}
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

      {/* Modals */}
      <UserModal
        open={userModalOpen}
        onOpenChange={setUserModalOpen}
        user={selectedUser}
      />

      <UserStatusModal
        open={statusModalOpen}
        onOpenChange={setStatusModalOpen}
        user={selectedUser}
      />

      <UserPermissionsModal
        open={permissionsModalOpen}
        onOpenChange={setPermissionsModalOpen}
        user={selectedUser}
      />
    </div>
  );
}
