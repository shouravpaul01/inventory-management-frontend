"use client";

import { useState } from "react";
import { Plus, Users, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionHeader from "@/components/shared/SectionHeader";
import SearchInput from "@/components/shared/SearchInput";
import FilterSelect from "@/components/shared/FilterSelect";
import Pagination from "@/components/shared/Pagination";
import UserTable from "@/components/users/UserTable";
import UserModal from "@/components/users/UserModal";
import UserStatusModal from "@/components/users/UserStatusModal";
import UserPermissionsModal from "@/components/users/UserPermissionsModal";
import UserRolesModal from "@/components/users/UserRolesModal";
import { useGetUsersQuery } from "@/redux/api/userApi";
import { useGetDepartmentsQuery } from "@/redux/api/departmentApi";
import { usePermission } from "@/hooks/usePermission";
import { useDebounce } from "@/hooks/useDebounce";
import { TUser, TUserStatus } from "@/type";
import PermissionGuard from "@/components/shared/PermissionGuard";

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
  const [rolesModalOpen, setRolesModalOpen] = useState(false);
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<TUser | null>(null);

  const { data: deptData } = useGetDepartmentsQuery({ limit: 100 });
  const departments = deptData?.data || [];

  const { data, isLoading } = useGetUsersQuery(
    {
      searchTerm: debouncedSearch || undefined,
      departmentId: departmentId || undefined,
      status: (status as TUserStatus) || undefined,
      page,
      limit,
    },
    { skip: !can("user.view") }
  );

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

  const handleOpenRoles = (user: TUser) => {
    setSelectedUser(user);
    setRolesModalOpen(true);
  };

  const handleOpenPermissions = (user: TUser) => {
    setSelectedUser(user);
    setPermissionsModalOpen(true);
  };

  return (
    <PermissionGuard permission="user.view">
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

        <div className="w-full sm:w-52">
          <FilterSelect
            placeholder="Department"
            value={departmentId}
            onChange={(val) => {
              setDepartmentId(val);
              setPage(1);
            }}
            options={departments.map((d) => ({
              label: d.name,
              value: d.id,
            }))}
            includeAllOption
            allLabel="All Departments"
          />
        </div>

        <div className="w-full sm:w-40">
          <FilterSelect
            placeholder="Status"
            value={status}
            onChange={(val) => {
              setStatus(val as any);
              setPage(1);
            }}
            options={[
              { label: "Active", value: "ACTIVE" },
              { label: "Inactive", value: "INACTIVE" },
              { label: "Suspended", value: "SUSPENDED" },
            ]}
            includeAllOption
            allLabel="All Statuses"
          />
        </div>

        {(searchTerm || departmentId || status) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchTerm("");
              setDepartmentId("");
              setStatus("");
              setPage(1);
            }}
            className="h-11 px-3 text-xs text-muted-foreground hover:text-foreground gap-1.5 shrink-0 self-center sm:self-auto"
          >
            <RotateCcw className="size-3.5" />
            <span>Reset</span>
          </Button>
        )}
      </div>

      {/* User Table */}
      <UserTable
        users={users}
        isLoading={isLoading}
        onEdit={handleOpenEdit}
        onChangeStatus={handleOpenStatus}
        onManageRoles={handleOpenRoles}
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

      <UserRolesModal
        open={rolesModalOpen}
        onOpenChange={setRolesModalOpen}
        user={selectedUser}
      />

      <UserPermissionsModal
        open={permissionsModalOpen}
        onOpenChange={setPermissionsModalOpen}
        user={selectedUser}
        onOpenRoles={() => {
          setPermissionsModalOpen(false);
          setRolesModalOpen(true);
        }}
      />
      </div>
    </PermissionGuard>
  );
}
