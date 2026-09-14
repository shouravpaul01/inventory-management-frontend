"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface TableLoadingProps {
  columns?: number;
  colSpan?: number;
  rows?: number;
}

export default function TableLoading({
  columns = 4,
  colSpan,
  rows = 5,
}: TableLoadingProps) {
  const actualCols = colSpan || columns;
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow key={rowIndex}>
          {Array.from({ length: actualCols }).map((_, colIndex) => (
            <TableCell key={colIndex}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}