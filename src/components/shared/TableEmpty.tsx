"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import { Inbox } from "lucide-react";

interface TableEmptyProps {
  colSpan?: number;
  message?: string;
  description?: string;
}

export default function TableEmpty({
  colSpan = 4,
  message = "No data found",
  description = "Try adjusting your search or filters",
}: TableEmptyProps) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan}>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          {/* ICON */}
          <div className="mb-3">
            <Inbox className="w-10 h-10 text-muted-foreground opacity-70" />
          </div>

          {/* TEXT */}
          <p className="text-sm font-medium text-muted-foreground">
            {message}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        </div>
      </TableCell>
    </TableRow>
  );
}