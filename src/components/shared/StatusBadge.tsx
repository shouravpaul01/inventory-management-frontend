import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string | null | undefined;
  className?: string;
  size?: "sm" | "default";
}

export function StatusBadge({ status, className, size = "default" }: StatusBadgeProps) {
  if (!status) return null;

  const normalized = status.toUpperCase().replace(/\s+/g, "_");

  let colorClasses = "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700";
  let dotColor = "bg-zinc-400";

  switch (normalized) {
    // Green / Positive
    case "ACTIVE":
    case "IN_STOCK":
    case "APPROVED":
    case "FULFILLED":
    case "RECEIVED":
    case "RETURNED":
    case "GOOD":
    case "NEW":
      colorClasses = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
      dotColor = "bg-emerald-500";
      break;

    // Blue / In-Progress / Info
    case "ISSUED":
    case "DELIVERED":
    case "PERMANENT":
    case "SUBMITTED":
    case "TRANSFER":
    case "PURCHASE":
      colorClasses = "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30";
      dotColor = "bg-blue-500";
      break;

    // Amber / Pending / Warning
    case "PENDING":
    case "UNDER_REVIEW":
    case "PARTIALLY_APPROVED":
    case "PARTIALLY_FULFILLED":
    case "PARTIALLY_RETURNED":
    case "PARTIALLY_ISSUED":
    case "RESERVED":
    case "RETURN_PENDING":
    case "EXPECTED":
    case "TEMPORARY":
    case "FAIR":
    case "NEEDS_REPAIR":
    case "MAINTENANCE":
      colorClasses = "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30";
      dotColor = "bg-amber-500";
      break;

    // Purple / Special
    case "GIFT":
    case "GIFTED":
      colorClasses = "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30";
      dotColor = "bg-purple-500";
      break;

    // Red / Danger / Loss / Rejection
    case "REJECTED":
    case "CANCELLED":
    case "DAMAGED":
    case "LOST":
    case "DISPOSED":
    case "OVERDUE":
    case "SUSPENDED":
    case "FAILED":
      colorClasses = "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30";
      dotColor = "bg-rose-500";
      break;

    // Neutral / Inactive / Draft
    case "DRAFT":
    case "INACTIVE":
    case "CLOSED":
    case "NOT_REQUIRED":
    default:
      colorClasses = "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/20";
      dotColor = "bg-zinc-400";
      break;
  }

  const label = normalized.replace(/_/g, " ");

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5 font-medium tracking-wide capitalize",
        size === "sm" ? "text-[10px] px-1.5 py-0 h-5" : "text-xs px-2.5 py-0.5",
        colorClasses,
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full shrink-0", dotColor)} />
      <span>{label.toLowerCase()}</span>
    </Badge>
  );
}
