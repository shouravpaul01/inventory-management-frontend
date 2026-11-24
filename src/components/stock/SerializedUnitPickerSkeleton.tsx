"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SerializedUnitPickerSkeletonProps {
  className?: string;
  cardsCount?: number;
}

export function SerializedUnitPickerSkeleton({
  className,
  cardsCount = 4,
}: SerializedUnitPickerSkeletonProps) {
  return (
    <div className={cn("space-y-2.5 border rounded-lg p-3 bg-card/60", className)}>
      {/* Top Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20 rounded-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-10" />
        </div>
      </div>

      {/* Search Input Skeleton */}
      <Skeleton className="h-9 w-full rounded-lg" />

      {/* Grid of Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-hidden">
        {Array.from({ length: cardsCount }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-muted/20"
          >
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <Skeleton className="size-3.5 rounded shrink-0" />
              <div className="space-y-1.5 flex-1 min-w-0">
                <Skeleton className="h-3 w-28 max-w-full" />
                <Skeleton className="h-2.5 w-20 max-w-full" />
              </div>
            </div>
            <Skeleton className="h-4 w-12 rounded shrink-0 ml-1.5" />
          </div>
        ))}
      </div>

      {/* Bottom status text */}
      <div className="flex items-center gap-1.5 pt-1 text-[11px] text-muted-foreground">
        <Loader2 className="size-3 animate-spin text-primary" />
        <span>Loading active units at this location...</span>
      </div>
    </div>
  );
}

export default SerializedUnitPickerSkeleton;
