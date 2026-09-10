"use client";

import { ReactNode } from "react";
import { SearchX } from "lucide-react";

interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({
  icon,
  title = "Nothing Found",
  description = "We couldn't find any matching items.",
  action,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[320px] items-center justify-center">
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