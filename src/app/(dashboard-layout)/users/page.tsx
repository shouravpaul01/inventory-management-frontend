"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  UserPlus,
  MoreVertical,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PermissionGate } from "@/components/shared/permissions/PermissionGate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useGetAllUsersQuery,
  useCreateUserMutation,
  useUpdateUserStatusMutation,
} from "@/redux/api/usersApi";
import { useGetAllDepartmentsQuery } from "@/redux/api/departmentsApi";
import { useGetAllRolesQuery } from "@/redux/api/rbacApi";
import { IUser, UserStatus } from "@/types";
import { toast } from "sonner";

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  // Queries
  const { data: usersRes, isLoading, isFetching } = useGetAllUsersQuery({
    searchTerm: searchTerm || undefined,
    departmentId: selectedDept !== "ALL" ? selectedDept : undefined,
    status: selectedStatus !== "ALL" ? selectedStatus : undefined,
    page,
    limit: 10,
  });

  const { data: deptRes } = useGetAllDepartmentsQuery();
  const { data: rolesRes } = useGetAllRolesQuery();

  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateStatus] = useUpdateUserStatusMutation();

  // Create User Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: "",
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    departmentId: "",
    roleIds: [] as string[],
  });
  const [showPassword, setShowPassword] = useState(false);

  const users = usersRes?.data || [];
  const meta = usersRes?.meta || { page: 1, limit: 10, total: users.length };
  const departments = deptRes?.data || [];
  const roles = rolesRes?.data || [];

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.username || !formData.email || !formData.firstName || !formData.departmentId || !formData.password) {
      toast.error("Please fill in all mandatory fields.");
      return;
    }

    try {
      await createUser(formData).unwrap();
      toast.success("User account created successfully.");
      setIsCreateOpen(false);
      setFormData({
        employeeId: "",
        username: "",
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        phone: "",
        departmentId: "",
        roleIds: [],
      });
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to create user account.");
    }
  };

  const handleStatusToggle = async (user: IUser, newStatus: UserStatus) => {
    try {
      await updateStatus({ id: user.id, status: newStatus }).unwrap();
      toast.success(`User status updated to ${newStatus}.`);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update user status.");
    }
  };

  const columns: Column<IUser>[] = [
    {
      key: "name",
      header: "Personnel / User",
      render: (user) => (
        <div className="flex items-center gap-2.5 min-w-[160px]">
          <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 border border-primary/20">
            {user.firstName[0]}
            {user.lastName?.[0] || ""}
          </div>
          <div className="min-w-0">
            <Link
              href={`/users/${user.id}`}
              className="font-semibold text-foreground hover:text-primary transition-colors truncate block"
            >
              {user.firstName} {user.lastName}
            </Link>
            <span className="text-[11px] text-muted-foreground block font-mono truncate">
              @{user.username}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "employeeId",
      header: "Employee ID",
      render: (user) => (
        <span className="font-mono text-xs font-medium text-foreground">
          {user.employeeId}
        </span>
      ),
    },
    {
      key: "email",
      header: "Email & Phone",
      render: (user) => (
        <div className="text-xs space-y-0.5">
          <div className="text-foreground truncate max-w-[180px]">{user.email}</div>
          <div className="text-[11px] text-muted-foreground">{user.phone || "—"}</div>
        </div>
      ),
    },
    {
      key: "department",
      header: "Department",
      render: (user) => (
        <Badge variant="outline" className="text-xs bg-muted/30">
          {user.department?.code || "CSE"}
        </Badge>
      ),
    },
    {
      key: "roles",
      header: "Assigned Roles",
      render: (user) => (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {user.isSuperAdmin ? (
            <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px]">
              Super Admin
            </Badge>
          ) : user.roles && user.roles.length > 0 ? (
            user.roles.map((r) => (
              <Badge key={r.id || r.roleId} variant="outline" className="text-[10px]">
                {r.role?.name || "Role"}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (user) => <StatusBadge status={user.status} size="sm" />,
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      headerClassName: "text-right",
      render: (user) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="size-8">
              <MoreVertical className="size-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 text-xs">
            <DropdownMenuLabel>User Options</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/users/${user.id}`} className="cursor-pointer">
                View Profile & Permissions
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <PermissionGate permission="user.status">
              <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase">
                Change Status
              </DropdownMenuLabel>
              {user.status !== "ACTIVE" && (
                <DropdownMenuItem onClick={() => handleStatusToggle(user, "ACTIVE")}>
                  Set to Active
                </DropdownMenuItem>
              )}
              {user.status !== "INACTIVE" && (
                <DropdownMenuItem onClick={() => handleStatusToggle(user, "INACTIVE")}>
                  Set to Inactive
                </DropdownMenuItem>
              )}
              {user.status !== "SUSPENDED" && (
                <DropdownMenuItem
                  onClick={() => handleStatusToggle(user, "SUSPENDED")}
                  className="text-destructive"
                >
                  Suspend Account
                </DropdownMenuItem>
              )}
            </PermissionGate>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Faculty & Personnel Management"
        description="Administer university department user accounts, security roles, status configurations, and individual authorization grants."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Administration" },
          { label: "Users" },
        ]}
      >
        <PermissionGate permission="user.create">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 gap-1.5 text-xs font-semibold">
                <UserPlus className="size-3.5" />
                <span>Create User Account</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Department User Account</DialogTitle>
                <DialogDescription>
                  Provision a new authorized personnel account. Credentials will be securely hashed upon creation.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateSubmit} className="space-y-4 py-2 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Employee ID *</label>
                    <Input
                      required
                      placeholder="EMP-001234"
                      value={formData.employeeId}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                      className="text-xs h-9"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Username *</label>
                    <Input
                      required
                      placeholder="e.g. rahim.cse"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                      className="text-xs h-9"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">First Name *</label>
                    <Input
                      required
                      placeholder="First name"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="text-xs h-9"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Last Name</label>
                    <Input
                      placeholder="Last name"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="text-xs h-9"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Official Email *</label>
                    <Input
                      type="email"
                      required
                      placeholder="faculty@univ.edu"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="text-xs h-9"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Contact Phone</label>
                    <Input
                      placeholder="+8801700000000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="text-xs h-9"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Department *</label>
                  <Select
                    value={formData.departmentId}
                    onValueChange={(val) => setFormData({ ...formData, departmentId: val })}
                  >
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id} className="text-xs">
                          {d.name} ({d.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Initial Security Password *</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Min. 6 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="text-xs h-9 pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Initial Roles (Optional)</label>
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg border bg-muted/20">
                    {roles.map((r) => {
                      const isChecked = formData.roleIds.includes(r.id);
                      return (
                        <label
                          key={r.id}
                          className="flex items-center gap-2 text-xs cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ ...formData, roleIds: [...formData.roleIds, r.id] });
                              } else {
                                setFormData({
                                  ...formData,
                                  roleIds: formData.roleIds.filter((id) => id !== r.id),
                                });
                              }
                            }}
                            className="rounded border-input text-primary focus:ring-primary size-3.5"
                          />
                          <span className="truncate">{r.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <DialogFooter className="pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreateOpen(false)}
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={isCreating}>
                    {isCreating ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin mr-1.5" />
                        Provisioning...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </PermissionGate>
      </PageHeader>

      {/* Users DataTable */}
      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading || isFetching}
        searchQuery={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by name, email, employee ID..."
        filters={
          <div className="flex items-center gap-2">
            <Select value={selectedDept} onValueChange={setSelectedDept}>
              <SelectTrigger className="text-xs h-9 w-40 bg-background">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="text-xs h-9 w-32 bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
        pagination={{
          page: meta.page,
          limit: meta.limit,
          total: meta.total,
          onPageChange: setPage,
        }}
        emptyTitle="No personnel records found"
        emptyDescription="No registered university users match your query parameters."
      />
    </div>
  );
}
