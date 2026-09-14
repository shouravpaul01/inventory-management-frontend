"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import TableEmpty from "@/components/shared/TableEmpty";
import TableLoading from "@/components/shared/TableLoading";
import { TUser } from "@/type";
import {
  MoreHorizontal,
  Edit,
  ShieldAlert,
  ShieldCheck,
  Building2,
  Lock,
} from "lucide-react";
import { usePermission } from "@/hooks/usePermission";

interface UserTableProps {
  users: TUser[];
  isLoading: boolean;
  onEdit: (user: TUser) => void;
  onChangeStatus: (user: TUser) => void;
  onOverridePermissions?: (user: TUser) => void;
}

export default function UserTable({
  users,
  isLoading,
  onEdit,
  onChangeStatus,
  onOverridePermissions,
}: UserTableProps) {
  const { can } = usePermission();

  const canUpdate = can("user.update");
  const canStatus = can("user.status");
  const canOverride = can("user.override_permission");

  return (
    <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-2xs">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="w-[110px] font-semibold text-xs">Emp ID</TableHead>
            <TableHead className="font-semibold text-xs">Staff Member</TableHead>
            <TableHead className="hidden md:table-cell font-semibold text-xs">
              Department
            </TableHead>
            <TableHead className="font-semibold text-xs">Roles</TableHead>
            <TableHead className="w-[90px] font-semibold text-xs">Status</TableHead>
            {(canUpdate || canStatus || canOverride) && (
              <TableHead className="w-[70px] text-right font-semibold text-xs">
                Actions
              </TableHead>
            )}
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading ? (
            <TableLoading colSpan={6} />
          ) : users.length === 0 ? (
            <TableEmpty colSpan={6} />
          ) : (
            users.map((user) => {
              const initials =
                user.firstName && user.lastName
                  ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
                  : user.username.slice(0, 2).toUpperCase();

              const roleList = Array.isArray(user.roles)
                ? user.roles.map((r: any) =>
                    typeof r === "string" ? r : r.role?.name || r.role?.code
                  )
                : [];

              return (
                <TableRow key={user.id} className="hover:bg-muted/30">
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {user.employeeId}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-xs text-foreground truncate">
                          {user.firstName} {user.lastName || ""}
                        </span>
                        <span className="text-[11px] text-muted-foreground truncate">
                          {user.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {user.department ? (
                      <div className="flex items-center gap-1.5">
                        <Building2 className="size-3.5 text-muted-foreground shrink-0" />
                        <span>{user.department.name}</span>
                      </div>
                    ) : (
                      "—"
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {user.isSuperAdmin && (
                        <Badge
                          variant="secondary"
                          className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] px-1.5 py-0"
                        >
                          Super Admin
                        </Badge>
                      )}
                      {roleList.slice(0, 2).map((roleName, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {roleName}
                        </Badge>
                      ))}
                      {roleList.length > 2 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{roleList.length - 2} more
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant={
                        user.status === "ACTIVE"
                          ? "default"
                          : user.status === "SUSPENDED"
                          ? "destructive"
                          : "secondary"
                      }
                      className="text-[10px] font-normal"
                    >
                      {user.status}
                    </Badge>
                  </TableCell>

                  {(canUpdate || canStatus || canOverride) && (
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-foreground"
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          {canUpdate && (
                            <DropdownMenuItem
                              onClick={() => onEdit(user)}
                              className="cursor-pointer"
                            >
                              <Edit className="mr-2 size-4" />
                              <span>Edit Account</span>
                            </DropdownMenuItem>
                          )}
                          {canStatus && (
                            <DropdownMenuItem
                              onClick={() => onChangeStatus(user)}
                              className="cursor-pointer"
                            >
                              <ShieldAlert className="mr-2 size-4" />
                              <span>Change Status</span>
                            </DropdownMenuItem>
                          )}
                          {canOverride && onOverridePermissions && (
                            <DropdownMenuItem
                              onClick={() => onOverridePermissions(user)}
                              className="cursor-pointer"
                            >
                              <ShieldCheck className="mr-2 size-4" />
                              <span>Permissions</span>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
