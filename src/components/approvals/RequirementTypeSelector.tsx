"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Zap, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export type TRequirementType = "REQUIRED" | "NOT_REQUIRED";

export interface RequirementTypeSelectorProps {
  /**
   * Field name when used inside a React Hook Form context. Defaults to "requirement".
   */
  name?: string;
  /**
   * Standalone controlled value. If not provided, will read from react-hook-form context.
   */
  value?: TRequirementType;
  /**
   * Standalone controlled change handler. If not provided, will update react-hook-form context.
   */
  onChange?: (val: TRequirementType) => void;
  disabled?: boolean;
  className?: string;
  title?: string;
  description?: string;
  showBadge?: boolean;
  required?: boolean;
}

export default function RequirementTypeSelector({
  name = "requirement",
  value: controlledValue,
  onChange: controlledOnChange,
  disabled = false,
  className,
  title = "Policy Objective (Requirement Type)",
  description = "By default, all database mutations (creating or editing items, stock, categories, requisitions, departments) require Super Admin approval. Choose whether designated targets bypass this baseline or require staged sign-off.",
  showBadge = true,
  required = true,
}: RequirementTypeSelectorProps) {
  const formContext = useFormContext();

  const isRHF = !controlledValue && formContext !== null;
  const formValue = isRHF
    ? (formContext.watch(name) as TRequirementType)
    : undefined;

  const currentRequirement: TRequirementType =
    controlledValue || formValue || "NOT_REQUIRED";

  const handleSelect = (nextVal: TRequirementType) => {
    if (disabled) return;

    if (controlledOnChange) {
      controlledOnChange(nextVal);
    } else if (isRHF && formContext) {
      formContext.setValue(name, nextVal, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  return (
    <div className={cn("space-y-2.5", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-primary shrink-0" />
          <span className="text-xs font-bold text-foreground">
            {title} {required && <span className="text-destructive">*</span>}
          </span>
        </div>

        {showBadge && (
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] font-mono font-bold px-2 py-0.5 transition-colors",
              currentRequirement === "NOT_REQUIRED"
                ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                : "border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10",
            )}
          >
            {currentRequirement === "NOT_REQUIRED"
              ? "⚡ EXEMPTION: FAST-TRACK DIRECT SAVE"
              : "🛡️ STRICT MAKER-CHECKER REVIEW"}
          </Badge>
        )}
      </div>

      {description && (
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}

      {/* Comparison Option Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
        {/* Option 1: Exempt From Approval */}
        <div
          onClick={() => handleSelect("NOT_REQUIRED")}
          className={cn(
            "relative p-4 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between gap-3 text-left group",
            disabled && "opacity-60 cursor-not-allowed pointer-events-none",
            currentRequirement === "NOT_REQUIRED"
              ? "bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/50 shadow-xs ring-1 ring-emerald-500/30 dark:from-emerald-950/30"
              : "bg-card border-border/80 hover:bg-muted/30 hover:border-border",
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "size-9 rounded-lg flex items-center justify-center shrink-0 border transition-all duration-200",
                  currentRequirement === "NOT_REQUIRED"
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-2xs scale-105"
                    : "bg-muted text-muted-foreground border-border",
                )}
              >
                <Zap className="size-4.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">
                  Exempt From Approval
                </p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold font-mono tracking-tight">
                  DIRECT LIVE DATABASE SAVE
                </p>
              </div>
            </div>

            <div
              className={cn(
                "size-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                currentRequirement === "NOT_REQUIRED"
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-muted-foreground/40 bg-background",
              )}
            >
              {currentRequirement === "NOT_REQUIRED" && (
                <div className="size-1.5 rounded-full bg-white" />
              )}
            </div>
          </div>

          <div className="space-y-1.5 text-[11px] text-muted-foreground border-t pt-2.5 border-border/60">
            <p className="leading-snug text-foreground/90">
              <strong>How it works:</strong> Target can create or edit records immediately. No approval requests are queued.
            </p>
            <p className="text-[10px] text-muted-foreground leading-snug">
              <strong>Recommended for:</strong> Trusted department chairs, senior storekeepers, or routine low-risk everyday entries.
            </p>
          </div>
        </div>

        {/* Option 2: Require Approval */}
        <div
          onClick={() => handleSelect("REQUIRED")}
          className={cn(
            "relative p-4 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between gap-3 text-left group",
            disabled && "opacity-60 cursor-not-allowed pointer-events-none",
            currentRequirement === "REQUIRED"
              ? "bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/50 shadow-xs ring-1 ring-amber-500/30 dark:from-amber-950/30"
              : "bg-card border-border/80 hover:bg-muted/30 hover:border-border",
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "size-9 rounded-lg flex items-center justify-center shrink-0 border transition-all duration-200",
                  currentRequirement === "REQUIRED"
                    ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 shadow-2xs scale-105"
                    : "bg-muted text-muted-foreground border-border",
                )}
              >
                <ShieldAlert className="size-4.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">
                  Require Approval
                </p>
                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold font-mono tracking-tight">
                  STAGED MAKER-CHECKER REVIEW
                </p>
              </div>
            </div>

            <div
              className={cn(
                "size-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                currentRequirement === "REQUIRED"
                  ? "border-amber-600 bg-amber-600 text-white"
                  : "border-muted-foreground/40 bg-background",
              )}
            >
              {currentRequirement === "REQUIRED" && (
                <div className="size-1.5 rounded-full bg-white" />
              )}
            </div>
          </div>

          <div className="space-y-1.5 text-[11px] text-muted-foreground border-t pt-2.5 border-border/60">
            <p className="leading-snug text-foreground/90">
              <strong>How it works:</strong> Mutations are paused in the Approvals Inbox until verified and signed off by authorized reviewers.
            </p>
            <p className="text-[10px] text-muted-foreground leading-snug">
              <strong>Recommended for:</strong> High-value capital items, critical adjustments, asset disposal, or actions by junior staff.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
