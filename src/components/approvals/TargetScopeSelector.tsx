"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { FormSelect } from "@/components/shared/form/FormSelect";

export type TTargetScope = "USER" | "ROLE";

export interface TargetScopeOption {
  label: string;
  value: string;
}

export interface TargetScopeSelectorProps {
  /**
   * Field name when used inside a React Hook Form context. Defaults to "scope".
   */
  name?: string;
  /**
   * Field name for User ID in form context. Defaults to "userId".
   */
  userIdName?: string;
  /**
   * Field name for Role ID in form context. Defaults to "roleId".
   */
  roleIdName?: string;
  /**
   * Standalone controlled scope. If not provided, will read from react-hook-form context.
   */
  scope?: TTargetScope;
  /**
   * Standalone controlled scope change handler.
   */
  onScopeChange?: (scope: TTargetScope) => void;
  /**
   * Options list for User Select dropdown.
   */
  userOptions?: TargetScopeOption[];
  /**
   * Options list for Role Select dropdown.
   */
  roleOptions?: TargetScopeOption[];
  disabled?: boolean;
  className?: string;
  title?: string;
  description?: string;
  showBadge?: boolean;
  showSecurityCallout?: boolean;
  showTargetDropdown?: boolean;
  required?: boolean;
}

export default function TargetScopeSelector({
  name = "scope",
  userIdName = "userId",
  roleIdName = "roleId",
  scope: controlledScope,
  onScopeChange: controlledOnScopeChange,
  userOptions = [],
  roleOptions = [],
  disabled = false,
  className,
  title = "Target Scope (Assignment Level)",
  description = "Decide whether this rule applies exclusively to one designated employee account or uniformly across an entire institutional role.",
  showBadge = true,
  showSecurityCallout = true,
  showTargetDropdown = true,
  required = true,
}: TargetScopeSelectorProps) {
  const formContext = useFormContext();

  const isRHF = !controlledScope && formContext !== null;
  const formScope = isRHF
    ? (formContext.watch(name) as TTargetScope)
    : undefined;

  const currentScope: TTargetScope =
    controlledScope || formScope || "USER";

  const handleSelectScope = (nextScope: TTargetScope) => {
    if (disabled) return;

    if (controlledOnScopeChange) {
      controlledOnScopeChange(nextScope);
    } else if (isRHF && formContext) {
      formContext.setValue(name, nextScope, {
        shouldValidate: true,
        shouldDirty: true,
      });

      // Clear the opposite field to prevent orphaned IDs
      if (nextScope === "USER") {
        formContext.setValue(roleIdName, "", {
          shouldValidate: true,
          shouldDirty: true,
        });
      } else {
        formContext.setValue(userIdName, "", {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Scope Switcher Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-primary shrink-0" />
            <span className="text-xs font-bold text-foreground">
              {title} {required && <span className="text-destructive">*</span>}
            </span>
          </div>

          {showBadge && (
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-mono font-bold px-2 py-0.5 transition-colors",
                currentScope === "USER"
                  ? "border-sky-500/40 text-sky-600 dark:text-sky-400 bg-sky-500/10"
                  : "border-indigo-500/40 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10",
              )}
            >
              {currentScope === "USER"
                ? "👤 SPECIFIC PERSON (USER)"
                : "👥 ROLE-WIDE GOVERNANCE"}
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
          {/* Option 1: Specific Person (User) */}
          <div
            onClick={() => handleSelectScope("USER")}
            className={cn(
              "relative p-4 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between gap-3 text-left group",
              disabled && "opacity-60 cursor-not-allowed pointer-events-none",
              currentScope === "USER"
                ? "bg-gradient-to-br from-sky-500/10 via-sky-500/5 to-transparent border-sky-500/50 shadow-xs ring-1 ring-sky-500/30 dark:from-sky-950/30"
                : "bg-card border-border/80 hover:bg-muted/30 hover:border-border",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "size-9 rounded-lg flex items-center justify-center shrink-0 border transition-all duration-200",
                    currentScope === "USER"
                      ? "bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/30 shadow-2xs scale-105"
                      : "bg-muted text-muted-foreground border-border",
                  )}
                >
                  <UserCheck className="size-4.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">
                    Specific Person (User)
                  </p>
                  <p className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold font-mono tracking-tight">
                    INDIVIDUAL ACCOUNT TARGET
                  </p>
                </div>
              </div>

              <div
                className={cn(
                  "size-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                  currentScope === "USER"
                    ? "border-sky-600 bg-sky-600 text-white"
                    : "border-muted-foreground/40 bg-background",
                )}
              >
                {currentScope === "USER" && (
                  <div className="size-1.5 rounded-full bg-white" />
                )}
              </div>
            </div>

            <div className="space-y-1.5 text-[11px] text-muted-foreground border-t pt-2.5 border-border/60">
              <p className="leading-snug text-foreground/90">
                <strong>Personal Binding:</strong> Applies exclusively to one employee account. Overrides general role defaults for this person only.
              </p>
              <p className="text-[10px] text-muted-foreground leading-snug">
                <strong>Why choose this:</strong> Grants trust to an experienced faculty member or senior officer without expanding privileges to everyone sharing their title.
              </p>
            </div>
          </div>

          {/* Option 2: Entire Role */}
          <div
            onClick={() => handleSelectScope("ROLE")}
            className={cn(
              "relative p-4 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between gap-3 text-left group",
              disabled && "opacity-60 cursor-not-allowed pointer-events-none",
              currentScope === "ROLE"
                ? "bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent border-indigo-500/50 shadow-xs ring-1 ring-indigo-500/30 dark:from-indigo-950/30"
                : "bg-card border-border/80 hover:bg-muted/30 hover:border-border",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "size-9 rounded-lg flex items-center justify-center shrink-0 border transition-all duration-200",
                    currentScope === "ROLE"
                      ? "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 shadow-2xs scale-105"
                      : "bg-muted text-muted-foreground border-border",
                  )}
                >
                  <Users className="size-4.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">
                    Entire Institutional Role
                  </p>
                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold font-mono tracking-tight">
                    ROLE-WIDE GOVERNANCE
                  </p>
                </div>
              </div>

              <div
                className={cn(
                  "size-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                  currentScope === "ROLE"
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-muted-foreground/40 bg-background",
                )}
              >
                {currentScope === "ROLE" && (
                  <div className="size-1.5 rounded-full bg-white" />
                )}
              </div>
            </div>

            <div className="space-y-1.5 text-[11px] text-muted-foreground border-t pt-2.5 border-border/60">
              <p className="leading-snug text-foreground/90">
                <strong>Universal Standardization:</strong> Automatically applies to all current and future personnel holding this organizational role.
              </p>
              <p className="text-[10px] text-muted-foreground leading-snug">
                <strong>Why choose this:</strong> Enforces consistent governance across an entire title (e.g., all Store Keepers, Department Heads, or Inventory Managers).
              </p>
            </div>
          </div>
        </div>

        {/* Security Callout explaining why System/All Users is restricted */}
        {showSecurityCallout && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-primary/20 bg-primary/5 text-xs">
            <Info className="size-4 text-primary shrink-0 mt-0.5" />
            <div className="text-[11px] text-muted-foreground leading-relaxed">
              <strong className="text-foreground">
                Why are System-Wide / &ldquo;All Users&rdquo; exemptions restricted?
              </strong>{" "}
              To protect institutional audit compliance and prevent accidental unverified database mutations. Every exemption must be tied directly to an accountable verified individual or a structured organizational role.
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Target Person / Role Selector */}
      {showTargetDropdown && (
        <>
          {currentScope === "USER" && (
            <div className="p-4 rounded-xl border border-sky-500/25 bg-sky-500/5 space-y-2.5">
              <div className="flex items-center gap-2">
                <UserCheck className="size-4 text-sky-600 dark:text-sky-400" />
                <span className="text-xs font-bold text-foreground">
                  Designated Faculty / Staff Member Account
                </span>
              </div>
              <FormSelect
                name={userIdName}
                label="Select Target Person (User)"
                placeholder="Search and choose a user..."
                options={userOptions}
                required
                disabled={disabled}
              />
              <p className="text-[11px] text-muted-foreground">
                This designated individual will receive the policy objective configured above for the selected actions below.
              </p>
            </div>
          )}

          {currentScope === "ROLE" && (
            <div className="p-4 rounded-xl border border-indigo-500/25 bg-indigo-500/5 space-y-2.5">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold text-foreground">
                  Designated Institutional Role
                </span>
              </div>
              <FormSelect
                name={roleIdName}
                label="Select Target Role"
                placeholder="Search and choose a role..."
                options={roleOptions}
                required
                disabled={disabled}
              />
              <p className="text-[11px] text-muted-foreground">
                All current members and future assignees of this role will automatically inherit this governance policy.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
