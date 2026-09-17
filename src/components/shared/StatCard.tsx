"use client";

import * as React from "react";
import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatCardVariant =
  | "primary"
  | "sky"
  | "emerald"
  | "rose"
  | "amber"
  | "indigo"
  | "purple"
  | "default";

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  icon?: LucideIcon | React.ReactNode;
  variant?: StatCardVariant;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  trend?: {
    value: number | string;
    isPositive?: boolean;
    label?: string;
  };
  colorValue?: boolean;
  isLoading?: boolean;
}

const variantStyles: Record<
  StatCardVariant,
  {
    iconBox: string;
    iconColor: string;
    value: string;
    glow: string;
    topLine: string;
    borderHover: string;
    shadowHover: string;
  }
> = {
  primary: {
    iconBox:
      "bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 text-primary border-primary/25 shadow-xs shadow-primary/15",
    iconColor: "text-primary",
    value: "text-primary",
    glow: "bg-primary",
    topLine: "text-primary",
    borderHover: "hover:border-primary/40 hover:shadow-primary/5",
    shadowHover: "group-hover:shadow-primary/10",
  },
  sky: {
    iconBox:
      "bg-gradient-to-br from-sky-500/20 via-sky-500/10 to-sky-500/5 text-sky-600 dark:text-sky-400 border-sky-500/25 shadow-xs shadow-sky-500/15",
    iconColor: "text-sky-600 dark:text-sky-400",
    value: "text-sky-600 dark:text-sky-400",
    glow: "bg-sky-500",
    topLine: "text-sky-500",
    borderHover: "hover:border-sky-500/40 hover:shadow-sky-500/5",
    shadowHover: "group-hover:shadow-sky-500/10",
  },
  emerald: {
    iconBox:
      "bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 shadow-xs shadow-emerald-500/15",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    value: "text-emerald-600 dark:text-emerald-400",
    glow: "bg-emerald-500",
    topLine: "text-emerald-500",
    borderHover: "hover:border-emerald-500/40 hover:shadow-emerald-500/5",
    shadowHover: "group-hover:shadow-emerald-500/10",
  },
  rose: {
    iconBox:
      "bg-gradient-to-br from-rose-500/20 via-rose-500/10 to-rose-500/5 text-rose-600 dark:text-rose-400 border-rose-500/25 shadow-xs shadow-rose-500/15",
    iconColor: "text-rose-600 dark:text-rose-400",
    value: "text-rose-600 dark:text-rose-400",
    glow: "bg-rose-500",
    topLine: "text-rose-500",
    borderHover: "hover:border-rose-500/40 hover:shadow-rose-500/5",
    shadowHover: "group-hover:shadow-rose-500/10",
  },
  amber: {
    iconBox:
      "bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-amber-500/5 text-amber-600 dark:text-amber-400 border-amber-500/25 shadow-xs shadow-amber-500/15",
    iconColor: "text-amber-600 dark:text-amber-400",
    value: "text-amber-700 dark:text-amber-400",
    glow: "bg-amber-500",
    topLine: "text-amber-500",
    borderHover: "hover:border-amber-500/40 hover:shadow-amber-500/5",
    shadowHover: "group-hover:shadow-amber-500/10",
  },
  indigo: {
    iconBox:
      "bg-gradient-to-br from-indigo-500/20 via-indigo-500/10 to-indigo-500/5 text-indigo-600 dark:text-indigo-400 border-indigo-500/25 shadow-xs shadow-indigo-500/15",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    value: "text-indigo-600 dark:text-indigo-400",
    glow: "bg-indigo-500",
    topLine: "text-indigo-500",
    borderHover: "hover:border-indigo-500/40 hover:shadow-indigo-500/5",
    shadowHover: "group-hover:shadow-indigo-500/10",
  },
  purple: {
    iconBox:
      "bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-purple-500/5 text-purple-600 dark:text-purple-400 border-purple-500/25 shadow-xs shadow-purple-500/15",
    iconColor: "text-purple-600 dark:text-purple-400",
    value: "text-purple-600 dark:text-purple-400",
    glow: "bg-purple-500",
    topLine: "text-purple-500",
    borderHover: "hover:border-purple-500/40 hover:shadow-purple-500/5",
    shadowHover: "group-hover:shadow-purple-500/10",
  },
  default: {
    iconBox:
      "bg-gradient-to-br from-muted/80 to-muted/40 text-muted-foreground border-border shadow-xs",
    iconColor: "text-muted-foreground",
    value: "text-foreground",
    glow: "bg-muted-foreground",
    topLine: "text-border",
    borderHover: "hover:border-border hover:shadow-xs",
    shadowHover: "",
  },
};

export default function StatCard({
  title,
  value,
  icon,
  variant = "default",
  description,
  badge,
  trend,
  colorValue = true,
  isLoading = false,
  className,
  onClick,
  ...props
}: StatCardProps) {
  const styles = variantStyles[variant] || variantStyles.default;

  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    const IconComponent = icon as LucideIcon;
    return (
      <IconComponent className="size-5 sm:size-5.5 transition-transform duration-300 group-hover:scale-110" />
    );
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-card via-card to-card/95 p-4 sm:p-5 transition-all duration-300 shadow-xs hover:shadow-lg hover:-translate-y-0.5 group",
        styles.borderHover,
        onClick && "cursor-pointer active:scale-[0.98] select-none",
        className,
      )}
      onClick={onClick}
      {...props}
    >
      {/* Top sleek accent hairline */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          styles.topLine,
        )}
      />

      {/* Ambient background aura on hover */}
      <div
        className={cn(
          "pointer-events-none absolute -right-10 -bottom-10 size-36 rounded-full opacity-0 blur-3xl transition-all duration-500 group-hover:opacity-20 group-hover:scale-125",
          styles.glow,
        )}
      />

      <div className="flex items-center gap-4 relative z-10">
        {icon && (
          <div
            className={cn(
              "size-12 rounded-xl border flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-105 group-hover:shadow-md",
              styles.iconBox,
            )}
          >
            {renderIcon()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs sm:text-[13px] font-bold text-foreground/80 group-hover:text-foreground transition-colors truncate">
              {title}
            </p>

            <div className="flex items-center gap-1.5 shrink-0">
              {trend && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-full border",
                    trend.isPositive !== false
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
                  )}
                >
                  {trend.isPositive !== false ? (
                    <TrendingUp className="size-2.5" />
                  ) : (
                    <TrendingDown className="size-2.5" />
                  )}
                  {trend.value}
                </span>
              )}

              {badge && <div className="shrink-0">{badge}</div>}
            </div>
          </div>

          {isLoading ? (
            <div className="h-7 w-20 bg-muted/60 animate-pulse rounded-md my-1.5" />
          ) : (
            <p
              className={cn(
                "text-2xl sm:text-3xl font-black tracking-tight tabular-nums transition-colors duration-200 mt-1",
                colorValue ? styles.value : "text-foreground",
              )}
            >
              {value}
            </p>
          )}

          {description && (
            <p className="text-[11px] sm:text-xs text-muted-foreground font-medium mt-1 truncate leading-tight">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
