"use client";

import { ReactNode } from "react";
import { SearchX } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}

export default function EmptyState({
  icon,
  title = "Nothing Found",
  description = "We couldn't find any matching items.",
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  if (compact) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center p-6 text-center rounded-lg border border-dashed bg-muted/20",
          className,
        )}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/5 text-primary shrink-0">
          {icon ?? <SearchX className="h-5 w-5" />}
        </div>

        <h4 className="mt-3 text-xs font-semibold text-foreground">{title}</h4>

        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground max-w-xs">
          {description}
        </p>

        {action && <div className="mt-3">{action}</div>}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex min-h-[320px] items-center justify-center",
        className,
      )}
    >
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 ring-8 ring-primary/5">
          {icon ?? <SearchX className="h-10 w-10 text-primary" />}
        </div>

        <h3 className="mt-6 text-2xl font-bold text-foreground">
          {title}
        </h3>

        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          {description}
        </p>

        {action && <div className="mt-6">{action}</div>}
      </div>
    </div>
  );
}