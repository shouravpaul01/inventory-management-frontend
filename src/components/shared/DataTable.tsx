"use client";

import React, { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: ReactNode;
  render?: (row: T, index: number) => ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  actions?: ReactNode;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (newPage: number) => void;
  };
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  rowKey?: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search records...",
  filters,
  actions,
  pagination,
  emptyTitle = "No records found",
  emptyDescription = "There are currently no records matching your query or filters.",
  emptyAction,
  rowKey,
  onRowClick,
  className,
}: DataTableProps<T>) {
  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.total / pagination.limit))
    : 1;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search, Filters and Table Actions Bar */}
      {(onSearchChange || filters || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            {onSearchChange && (
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="search"
                  placeholder={searchPlaceholder}
                  value={searchQuery || ""}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-8 text-xs h-9 bg-background"
                />
              </div>
            )}
            {filters}
          </div>

          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}

      {/* Table Container */}
      <div className="rounded-xl border bg-card shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                {columns.map((col) => (
                  <TableHead
                    key={col.key}
                    className={cn(
                      "text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3",
                      col.headerClassName
                    )}
                  >
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, rIdx) => (
                  <TableRow key={rIdx}>
                    {columns.map((col) => (
                      <TableCell key={col.key} className="py-3.5">
                        <Skeleton className="h-4 w-full max-w-[140px]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-64 text-center py-10"
                  >
                    <div className="flex flex-col items-center justify-center text-center space-y-3">
                      <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                        <Inbox className="size-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-semibold text-sm text-foreground">
                          {emptyTitle}
                        </h4>
                        <p className="text-xs text-muted-foreground max-w-sm">
                          {emptyDescription}
                        </p>
                      </div>
                      {emptyAction && <div className="pt-2">{emptyAction}</div>}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, rIdx) => {
                  const key = rowKey ? rowKey(row, rIdx) : (row as any).id || rIdx;
                  return (
                    <TableRow
                      key={key}
                      onClick={() => onRowClick?.(row)}
                      className={cn(
                        "transition-colors",
                        onRowClick && "cursor-pointer hover:bg-muted/50"
                      )}
                    >
                      {columns.map((col) => (
                        <TableCell
                          key={col.key}
                          className={cn("text-xs py-3.5", col.className)}
                        >
                          {col.render
                            ? col.render(row, rIdx)
                            : (row as any)[col.key] ?? "—"}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Bar */}
        {pagination && pagination.total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t px-4 py-3 bg-muted/20 text-xs text-muted-foreground">
            <div>
              Showing{" "}
              <span className="font-semibold text-foreground">
                {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-foreground">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-foreground">
                {pagination.total}
              </span>{" "}
              results
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1 || isLoading}
                className="size-8"
              >
                <ChevronLeft className="size-4" />
                <span className="sr-only">Previous Page</span>
              </Button>

              <span className="px-2 text-xs font-medium">
                Page {pagination.page} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                disabled={pagination.page >= totalPages || isLoading}
                className="size-8"
              >
                <ChevronRight className="size-4" />
                <span className="sr-only">Next Page</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
