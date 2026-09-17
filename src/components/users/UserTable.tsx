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
  DropdownMenuSeparator,
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
  Shield,
  Building2,
  KeyRound,
  SlidersHorizontal,
  Eye,
} from "lucide-react";
import { usePermission } from "@/hooks/usePermission";

interface UserTableProps {
  users: TUser[];
  isLoading: boolean;
  onEdit: (user: TUser) => void;
  onChangeStatus: (user: TUser) => void;
  onManageRoles?: (user: TUser) => void;
  onOverridePermissions?: (user: TUser) => void;
  onViewDetails?: (user: TUser) => void;
}

export default function UserTable({
  users,
  isLoading,
  onEdit,
  onChangeStatus,
  onManageRoles,
  onOverridePermissions,
  onViewDetails,
}: UserTableProps) {
  const { can } = usePermission();

  const canUpdate = can("user.update");
  const canStatus = can("user.status");
  const canManageRoles = can("user.manage_roles") || can("user.update");
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
            <TableHead className="font-semibold text-xs">Assigned Roles</TableHead>
            <TableHead className="font-semibold text-xs min-w-[170px]">
              Access & Overrides
            </TableHead>
            <TableHead className="w-[90px] font-semibold text-xs">Status</TableHead>
            <TableHead className="w-[100px] text-right font-semibold text-xs">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading ? (
            <TableLoading colSpan={7} />
          ) : users.length === 0 ? (
            <TableEmpty colSpan={7} />
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

              // Calculate permission overrides
              const overrides = Array.isArray(user.permissions)
                ? (user.permissions as any[])
                : [];

              const grantsCount = overrides.filter(
                (p) => p.effect === "GRANT" || p.granted === true
              ).length;
              const revokesCount = overrides.filter(
                (p) => p.effect === "REVOKE" || p.granted === false
              ).length;
              const totalOverrides = grantsCount + revokesCount;

              const effectiveCount = Array.isArray(user.effectivePermissions)
                ? user.effectivePermissions.length
                : null;

              return (
                <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {user.employeeId}
                    </Badge>
                  </TableCell>

                  {/* Staff Member Info (Clickable for details) */}
                  <TableCell>
                    <div
                      className={
                        onViewDetails
                          ? "flex items-center gap-2.5 cursor-pointer group"
                          : "flex items-center gap-2.5"
                      }
                      onClick={() => onViewDetails?.(user)}
                      title={onViewDetails ? "Click to view full user details" : undefined}
                    >
                      <Avatar className="size-8 shrink-0 ring-1 ring-border group-hover:ring-primary/40 transition-all">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold group-hover:bg-primary/15">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-xs text-foreground truncate group-hover:text-primary transition-colors">
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

                  {/* Assigned Roles */}
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
                          className="text-[10px] px-1.5 py-0 bg-background"
                        >
                          {roleName}
                        </Badge>
                      ))}
                      {roleList.length > 2 && (
                        <span className="text-[10px] text-muted-foreground font-medium">
                          +{roleList.length - 2} more
                        </span>
                      )}
                      {roleList.length === 0 && !user.isSuperAdmin && (
                        <span className="text-[11px] text-muted-foreground italic">
                          None
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Access & Overrides Column */}
                  <TableCell>
                    <div
                      className={
                        canOverride && onOverridePermissions
                          ? "group flex flex-col gap-1 cursor-pointer"
                          : "flex flex-col gap-1"
                      }
                      onClick={() => {
                        if (canOverride && onOverridePermissions) {
                          onOverridePermissions(user);
                        }
                      }}
                      title={
                        canOverride
                          ? "Click to manage capability overrides"
                          : undefined
                      }
                    >
                      {/* Effective capabilities pill */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {user.isSuperAdmin ? (
                          <Badge
                            variant="secondary"
                            className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] px-1.5 py-0 gap-1 font-medium"
                          >
                            <ShieldCheck className="size-3 text-emerald-600" />
                            <span>Root Bypass (All)</span>
                          </Badge>
                        ) : effectiveCount !== null ? (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 gap-1 font-medium bg-muted group-hover:bg-muted/80 transition-colors"
                          >
                            <Shield className="size-3 text-primary" />
                            <span>{effectiveCount} Active Perms</span>
                          </Badge>
                        ) : null}

                        {canOverride && (
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-primary underline">
                            Edit
                          </span>
                        )}
                      </div>

                      {/* Overrides breakdown badges */}
                      <div className="flex items-center gap-1 flex-wrap">
                        {totalOverrides > 0 ? (
                          <>
                            {grantsCount > 0 && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-mono text-[10px] font-semibold border border-emerald-300/60 dark:border-emerald-800">
                                +{grantsCount} Granted
                              </span>
                            )}
                            {revokesCount > 0 && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-rose-100/70 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-mono text-[10px] font-semibold border border-rose-300/60 dark:border-rose-800">
                                -{revokesCount} Revoked
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-[10px] text-muted-foreground/80">
                            Role Defaults
                          </span>
                        )}
                      </div>
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

                  {/* Actions column */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {onViewDetails && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onViewDetails(user)}
                          className="size-8 text-muted-foreground hover:text-foreground"
                          title="View Full Details"
                        >
                          <Eye className="size-4" />
                        </Button>
                      )}

                      {(canUpdate || canStatus || canManageRoles || canOverride) && (
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
                          <DropdownMenuContent align="end" className="w-52">
                            {onViewDetails && (
                              <DropdownMenuItem
                                onClick={() => onViewDetails(user)}
                                className="cursor-pointer"
                              >
                                <Eye className="mr-2 size-4 text-primary" />
                                <span>View Details</span>
                              </DropdownMenuItem>
                            )}

                          
                            {canManageRoles && onManageRoles && (
                              <DropdownMenuItem
                                onClick={() => onManageRoles(user)}
                                className="cursor-pointer"
                              >
                                <KeyRound className="mr-2 size-4 text-purple-600" />
                                <span>Assign Roles</span>
                              </DropdownMenuItem>
                            )}

                            {(onViewDetails || canOverride || canManageRoles) && (
                              <DropdownMenuSeparator />
                            )}

                            {canUpdate && (
                              <DropdownMenuItem
                                onClick={() => onEdit(user)}
                                className="cursor-pointer"
                              >
                                <Edit className="mr-2 size-4 text-muted-foreground" />
                                <span>Edit Account</span>
                              </DropdownMenuItem>
                            )}

                            {canStatus && (
                              <DropdownMenuItem
                                onClick={() => onChangeStatus(user)}
                                className="cursor-pointer"
                              >
                                <ShieldAlert className="mr-2 size-4 text-amber-600" />
                                <span>Change Status</span>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
