"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import { Inbox } from "lucide-react";

export default function TableEmpty({ colSpan = 4 }: { colSpan?: number }) {
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
            No data found
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Try adjusting your search or filters
          </p>

        </div>
      </TableCell>
    </TableRow>
  );
}