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
import { TCategory } from "@/type";
import { MoreHorizontal, Edit, Trash2, Layers, CornerDownRight } from "lucide-react";
import { usePermission } from "@/hooks/usePermission";

interface CategoryTableProps {
  categories: TCategory[];
  isLoading: boolean;
  onEdit: (cat: TCategory) => void;
  onDelete: (id: string, name: string) => void;
}

export default function CategoryTable({
  categories,
  isLoading,
  onEdit,
  onDelete,
}: CategoryTableProps) {
  const { can } = usePermission();

  const canUpdate = can("category.update");
  const canDelete = can("category.delete");

  return (
    <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-2xs">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="w-[130px] font-semibold text-xs">Code</TableHead>
            <TableHead className="font-semibold text-xs">Category Name</TableHead>
            <TableHead className="font-semibold text-xs">Hierarchy Level</TableHead>
            <TableHead className="hidden md:table-cell font-semibold text-xs">
              Description
            </TableHead>
            <TableHead className="hidden sm:table-cell w-[130px] font-semibold text-xs">
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
            <TableLoading colSpan={6} />
          ) : categories.length === 0 ? (
            <TableEmpty colSpan={6} />
          ) : (
            categories.map((cat) => (
              <TableRow key={cat.id} className="hover:bg-muted/30">
                <TableCell>
                  <Badge variant="outline" className="font-mono text-xs">
                    {cat.code}
                  </Badge>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2">
                    {cat.parentId ? (
                      <CornerDownRight className="size-3.5 text-muted-foreground ml-2 shrink-0" />
                    ) : (
                      <Layers className="size-4 text-primary shrink-0" />
                    )}
                    <span className="font-medium text-sm text-foreground">
                      {cat.name}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  {cat.parent ? (
                    <Badge variant="secondary" className="text-xs font-normal">
                      Subcategory of {cat.parent.name}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                      Root Category
                    </Badge>
                  )}
                </TableCell>

                <TableCell className="hidden md:table-cell text-xs text-muted-foreground max-w-xs truncate">
                  {cat.description || "—"}
                </TableCell>

                <TableCell className="hidden sm:table-cell text-xs text-muted-foreground font-mono">
                  {new Date(cat.createdAt).toLocaleDateString()}
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
                            onClick={() => onEdit(cat)}
                            className="cursor-pointer"
                          >
                            <Edit className="mr-2 size-4" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                        )}
                        {canDelete && (
                          <DropdownMenuItem
                            onClick={() => onDelete(cat.id, cat.name)}
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
