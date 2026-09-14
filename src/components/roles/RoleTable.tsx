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
import TableEmpty from "@/components/shared/TableEmpty";
import TableLoading from "@/components/shared/TableLoading";
import { TRole } from "@/type";
import { MoreHorizontal, Edit, Trash2, Shield, Lock } from "lucide-react";
import { usePermission } from "@/hooks/usePermission";

interface RoleTableProps {
  roles: TRole[];
  isLoading: boolean;
  onEdit: (role: TRole) => void;
  onDelete: (id: string, name: string) => void;
}

export default function RoleTable({
  roles,
  isLoading,
  onEdit,
  onDelete,
}: RoleTableProps) {
  const { can } = usePermission();

  const canUpdate = can("role.update");
  const canDelete = can("role.delete");

  return (
    <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-2xs">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="w-[140px] font-semibold text-xs">Role Code</TableHead>
            <TableHead className="font-semibold text-xs">Role Name</TableHead>
            <TableHead className="w-[110px] font-semibold text-xs">Type</TableHead>
            <TableHead className="w-[140px] font-semibold text-xs">Capabilities</TableHead>
            <TableHead className="hidden md:table-cell font-semibold text-xs">
              Description
            </TableHead>
            {(canUpdate || canDelete) && (
              <TableHead className="w-[70px] text-right font-semibold text-xs">
                Actions
              </TableHead>
            )}
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading ? (
            <TableLoading colSpan={6} />
          ) : roles.length === 0 ? (
            <TableEmpty colSpan={6} />
          ) : (
            roles.map((role) => {
              const permCount = Array.isArray(role.permissions)
                ? role.permissions.length
                : 0;

              return (
                <TableRow key={role.id} className="hover:bg-muted/30">
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {role.code}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Shield className="size-4 text-primary shrink-0" />
                      <span className="font-medium text-sm text-foreground">
                        {role.name}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    {role.isSystem ? (
                      <Badge variant="secondary" className="gap-1 text-[11px] font-normal">
                        <Lock className="size-3" />
                        System
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[11px] font-normal text-muted-foreground">
                        Custom
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell>
                    <Badge variant="secondary" className="font-mono text-xs font-normal">
                      {permCount} permissions
                    </Badge>
                  </TableCell>

                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground max-w-xs truncate">
                    {role.description || "—"}
                  </TableCell>

                  {(canUpdate || canDelete) && (
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
                        <DropdownMenuContent align="end" className="w-36">
                          {canUpdate && (
                            <DropdownMenuItem
                              onClick={() => onEdit(role)}
                              className="cursor-pointer"
                            >
                              <Edit className="mr-2 size-4" />
                              <span>Edit Role</span>
                            </DropdownMenuItem>
                          )}
                          {canDelete && !role.isSystem && (
                            <DropdownMenuItem
                              onClick={() => onDelete(role.id, role.name)}
                              className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                              <Trash2 className="mr-2 size-4" />
                              <span>Delete</span>
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
