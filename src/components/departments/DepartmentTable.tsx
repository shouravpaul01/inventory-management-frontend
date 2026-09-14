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
import { TDepartment } from "@/type";
import { MoreHorizontal, Edit, Trash2, Building2 } from "lucide-react";
import { usePermission } from "@/hooks/usePermission";

interface DepartmentTableProps {
  departments: TDepartment[];
  isLoading: boolean;
  onEdit: (dept: TDepartment) => void;
  onDelete: (id: string, name: string) => void;
}

export default function DepartmentTable({
  departments,
  isLoading,
  onEdit,
  onDelete,
}: DepartmentTableProps) {
  const { can } = usePermission();

  const canUpdate = can("department.update");
  const canDelete = can("department.delete");

  return (
    <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-2xs">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="w-[120px] font-semibold text-xs">Code</TableHead>
            <TableHead className="font-semibold text-xs">Department Name</TableHead>
            <TableHead className="hidden md:table-cell font-semibold text-xs">
              Description
            </TableHead>
            <TableHead className="hidden sm:table-cell w-[140px] font-semibold text-xs">
              Created At
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
            <TableLoading colSpan={5} />
          ) : departments.length === 0 ? (
            <TableEmpty colSpan={5} />
          ) : (
            departments.map((dept) => (
              <TableRow key={dept.id} className="hover:bg-muted/30">
                <TableCell>
                  <Badge variant="outline" className="font-mono text-xs">
                    {dept.code}
                  </Badge>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2">
                    <Building2 className="size-4 text-muted-foreground shrink-0" />
                    <span className="font-medium text-sm text-foreground">
                      {dept.name}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="hidden md:table-cell text-xs text-muted-foreground max-w-xs truncate">
                  {dept.description || "—"}
                </TableCell>

                <TableCell className="hidden sm:table-cell text-xs text-muted-foreground font-mono">
                  {new Date(dept.createdAt).toLocaleDateString()}
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
                            onClick={() => onEdit(dept)}
                            className="cursor-pointer"
                          >
                            <Edit className="mr-2 size-4" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                        )}
                        {canDelete && (
                          <DropdownMenuItem
                            onClick={() => onDelete(dept.id, dept.name)}
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
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
