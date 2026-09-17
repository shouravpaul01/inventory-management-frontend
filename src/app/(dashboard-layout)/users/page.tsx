"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Users,
  UserCheck,
  Building2,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  Filter,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import SectionHeader from "@/components/shared/SectionHeader";
import SearchInput from "@/components/shared/SearchInput";
import FilterSelect from "@/components/shared/FilterSelect";
import Pagination from "@/components/shared/Pagination";
import UserTable from "@/components/users/UserTable";
import UserModal from "@/components/users/UserModal";
import UserStatusModal from "@/components/users/UserStatusModal";
import UserAccessControlModal from "@/components/users/UserAccessControlModal";
import UserDetailsModal from "@/components/users/UserDetailsModal";
import { useGetUsersQuery } from "@/redux/api/userApi";
import { useGetDepartmentsQuery } from "@/redux/api/departmentApi";
import { useGetRolesQuery } from "@/redux/api/rbacApi";
import { usePermission } from "@/hooks/usePermission";
import { useDebounce } from "@/hooks/useDebounce";
import { TUser, TUserStatus } from "@/type";
import PermissionGuard from "@/components/shared/PermissionGuard";
import { cn } from "@/lib/utils";

export default function UsersPage() {
  const { can } = usePermission();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);

  const [departmentId, setDepartmentId] = useState("");
  const [status, setStatus] = useState<TUserStatus | "">("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [overridesOnly, setOverridesOnly] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Modals state
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [accessModalTab, setAccessModalTab] = useState<"ROLES" | "OVERRIDES">("ROLES");

  const [selectedUser, setSelectedUser] = useState<TUser | null>(null);

  const { data: deptData } = useGetDepartmentsQuery({ limit: 100 });
  const departments = deptData?.data || [];

  const { data: rolesData } = useGetRolesQuery();
  const roles = rolesData?.data || [];

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

  const rawUsers = data?.data || [];
  const meta = data?.meta || {
    page: 1,
    limit: 10,
    total: 0,
    totalPage: 1,
  };

  // Client-side filtering for role & overrides toggle if selected
  const users = useMemo(() => {
    let list = rawUsers;

    if (roleFilter) {
      list = list.filter((u) => {
        if (roleFilter === "SUPER_ADMIN") return u.isSuperAdmin;
        if (!Array.isArray(u.roles)) return false;
        return u.roles.some((r: any) => {
          const code = typeof r === "string" ? r : r.role?.code || r.code;
          return code === roleFilter;
        });
      });
    }

    if (overridesOnly) {
      list = list.filter((u) => {
        const overrides = Array.isArray(u.permissions) ? u.permissions : [];
        return overrides.length > 0;
      });
    }

    return list;
  }, [rawUsers, roleFilter, overridesOnly]);

  // Executive KPI summary counts
  const kpiStats = useMemo(() => {
    const totalStaff = meta.total || rawUsers.length;
    const activeStaff = rawUsers.filter((u) => u.status === "ACTIVE").length;
    const withOverrides = rawUsers.filter((u) => {
      const overrides = Array.isArray(u.permissions) ? u.permissions : [];
      return overrides.length > 0;
    }).length;

    const uniqueDepts = new Set(
      rawUsers.map((u) => u.departmentId).filter(Boolean)
    ).size;

    return {
      totalStaff,
      activeStaff,
      withOverrides,
      uniqueDepts,
    };
  }, [rawUsers, meta.total]);

  const handleOpenDetails = (user: TUser) => {
    setSelectedUser(user);
    setDetailsModalOpen(true);
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
    setAccessModalTab("ROLES");
    setAccessModalOpen(true);
  };

  const handleOpenPermissions = (user: TUser) => {
    setSelectedUser(user);
    setAccessModalTab("OVERRIDES");
    setAccessModalOpen(true);
  };

  const isFiltered = Boolean(
    searchTerm || departmentId || status || roleFilter || overridesOnly
  );

  const handleResetFilters = () => {
    setSearchTerm("");
    setDepartmentId("");
    setStatus("");
    setRoleFilter("");
    setOverridesOnly(false);
    setPage(1);
  };

  return (
    <PermissionGuard permission="user.view">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <SectionHeader
            title="User & Staff Directory"
            description="Manage institutional faculty, department heads, storekeepers, role assignments, and granular capability overrides."
          />

          {can("user.create") && (
            <Button onClick={handleOpenCreate} className="shrink-0 gap-1.5 shadow-xs bg-primary">
              <Plus className="size-4" />
              <span>Add Staff Account</span>
            </Button>
          )}
        </div>

        {/* Executive KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Staff */}
          <Card className="border-border/70 shadow-2xs hover:border-primary/40 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">
                  Total Staff Directory
                </p>
                <p className="text-2xl font-bold tracking-tight text-foreground">
                  {kpiStats.totalStaff}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Registered university accounts
                </p>
              </div>
              <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Users className="size-5" />
              </div>
            </CardContent>
          </Card>

          {/* Active Accounts */}
          <Card className="border-border/70 shadow-2xs hover:border-emerald-500/40 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">
                  Active Status
                </p>
                <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                  {kpiStats.activeStaff}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Fully operational accounts
                </p>
              </div>
              <div className="size-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <UserCheck className="size-5" />
              </div>
            </CardContent>
          </Card>

          {/* Departments */}
          <Card className="border-border/70 shadow-2xs hover:border-blue-500/40 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">
                  Active Departments
                </p>
                <p className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                  {kpiStats.uniqueDepts}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Covered organizational units
                </p>
              </div>
              <div className="size-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Building2 className="size-5" />
              </div>
            </CardContent>
          </Card>

          {/* Custom Overrides (Clickable to filter!) */}
          <Card
            className={cn(
              "border-border/70 shadow-2xs cursor-pointer transition-all hover:scale-[1.01]",
              overridesOnly
                ? "ring-2 ring-primary bg-primary/5 border-primary"
                : "hover:border-primary/50"
            )}
            onClick={() => {
              setOverridesOnly((prev) => !prev);
              setPage(1);
            }}
            title="Click to toggle filter for staff with custom permission overrides"
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-medium text-muted-foreground">
                    Custom Overrides
                  </p>
                  {overridesOnly && (
                    <Badge variant="default" className="text-[9px] py-0 px-1 font-semibold h-4">
                      Filtered
                    </Badge>
                  )}
                </div>
                <p className="text-2xl font-bold tracking-tight text-primary">
                  {kpiStats.withOverrides}
                </p>
                <p className="text-[11px] text-primary/80 font-medium">
                  {overridesOnly ? "Click to clear filter" : "Click to view overrides only"}
                </p>
              </div>
              <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <SlidersHorizontal className="size-5" />
              </div>
            </CardContent>
          </Card>
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

          <div className="w-full sm:w-48">
            <FilterSelect
              placeholder="Role"
              value={roleFilter}
              onChange={(val) => {
                setRoleFilter(val);
                setPage(1);
              }}
              options={[
                { label: "Super Admin", value: "SUPER_ADMIN" },
                ...roles.map((r) => ({
                  label: r.name,
                  value: r.code,
                })),
              ]}
              includeAllOption
              allLabel="All Roles"
            />
          </div>

          <div className="w-full sm:w-48">
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

          <div className="w-full sm:w-36">
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

          {/* Quick Overrides Toggle Pill */}
          <Button
            type="button"
            variant={"outline"}
            onClick={() => {
              setOverridesOnly((prev) => !prev);
              setPage(1);
            }}
           
          >
            <Sparkles className="size-3.5" />
            <span>Overrides Only</span>
          </Button>

          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-10 px-3 text-xs text-muted-foreground hover:text-foreground gap-1.5 shrink-0 self-center sm:self-auto"
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
          onViewDetails={handleOpenDetails}
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

        {/* User Details Dialog Modal */}
        <UserDetailsModal
          open={detailsModalOpen}
          onOpenChange={setDetailsModalOpen}
          user={selectedUser}
          onOpenEdit={handleOpenEdit}
          onOpenRoles={handleOpenRoles}
          onOpenPermissions={handleOpenPermissions}
          onOpenStatus={handleOpenStatus}
        />

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

        {/* Unified Access & Authorization Control Dialog */}
        <UserAccessControlModal
          open={accessModalOpen}
          onOpenChange={setAccessModalOpen}
          user={selectedUser}
          initialTab={accessModalTab}
        />
      </div>
    </PermissionGuard>
  );
}
