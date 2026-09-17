"use client";

import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TUser } from "@/type";
import { TAccessStats } from "./types";
import {
  AlertTriangle,
  KeyRound,
  SlidersHorizontal,
  Eye,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserAccessHeaderProps {
  activeUser: TUser | null;
  selectedRoleIds: string[];
  stats: TAccessStats;
  hasUnsavedChanges: boolean;
  isRolesDirty: boolean;
  isOverridesDirty: boolean;
  activeTab: "ROLES" | "OVERRIDES" | "MATRIX";
  onResetAllOverrides: () => void;
}

export default function UserAccessHeader({
  activeUser,
  selectedRoleIds,
  stats,
  hasUnsavedChanges,
  isRolesDirty,
  isOverridesDirty,
  activeTab,
  onResetAllOverrides,
}: UserAccessHeaderProps) {
  const initials =
    activeUser?.firstName && activeUser?.lastName
      ? `${activeUser.firstName[0]}${activeUser.lastName[0]}`.toUpperCase()
      : (activeUser?.username || "U").slice(0, 2).toUpperCase();

  return (
    <div className="p-5 pb-3 border-b bg-card">
      <DialogHeader className="space-y-0 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="size-11 ring-2 ring-primary/20 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-base font-bold text-foreground truncate">
                  {activeUser?.firstName} {activeUser?.lastName || ""}
                </DialogTitle>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] px-1.5 py-0"
                >
                  {activeUser?.employeeId}
                </Badge>
                {activeUser?.isSuperAdmin && (
                  <Badge
                    variant="secondary"
                    className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] px-1.5 py-0 font-medium"
                  >
                    Super Admin
                  </Badge>
                )}
                <Badge
                  variant={
                    activeUser?.status === "ACTIVE" ? "default" : "secondary"
                  }
                  className="text-[10px] py-0 px-1.5 font-medium"
                >
                  {activeUser?.status}
                </Badge>
              </div>

              <DialogDescription asChild>
                <div className="text-sm space-y-1.5 pt-0.5">
                  <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      @{activeUser?.username}
                    </span>
                    <span>•</span>
                    <span className="truncate">{activeUser?.email}</span>
                    <span>•</span>
                    <span className="truncate">
                      {activeUser?.department?.name || "Central Administration"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap text-[11px] pt-0.5">
                    <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                      Access Posture:
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] px-2 py-0 font-medium bg-muted/40"
                    >
                      {selectedRoleIds.length} Roles Assigned
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-[10px] px-2 py-0 font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                    >
                      +{stats.explicitGrants} Grants
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-[10px] px-2 py-0 font-medium bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30"
                    >
                      -{stats.explicitRevokes} Revokes
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-[10px] px-2 py-0 font-medium bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30"
                    >
                      {activeUser?.isSuperAdmin
                        ? "Root Bypass (All)"
                        : `${stats.totalActive} Active Capabilities`}
                    </Badge>
                  </div>
                </div>
              </DialogDescription>
            </div>
          </div>

          {/* Unsaved Changes Live Alert Indicator */}
          {hasUnsavedChanges && (
            <div className="flex items-center gap-1.5 shrink-0 animate-pulse">
              <Badge
                variant="outline"
                className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[11px] gap-1 px-2 py-0.5"
              >
                <AlertTriangle className="size-3 text-amber-600" />
                <span>Unsaved Changes</span>
              </Badge>
            </div>
          )}
        </div>

        {/* Mode Switcher Tabs Navigation */}
        <div className="w-full mt-4 pt-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <TabsList className="tab-list-primary">
            <TabsTrigger
              value="ROLES"
              className="tab-trigger-primary"
            >
              <KeyRound className="size-3.5 shrink-0" />
              <span>1. Institutional Roles</span>
              <Badge
                variant="secondary"
                className={cn(
                  "text-[10px] py-0 px-1.5 h-4 ml-0.5 font-mono transition-colors",
                  activeTab === "ROLES"
                    ? "tab-badge-primary-active"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {selectedRoleIds.length}
              </Badge>
              {isRolesDirty && (
                <span className="size-1.5 rounded-full bg-amber-300 animate-ping" />
              )}
            </TabsTrigger>

            <TabsTrigger
              value="OVERRIDES"
              className="tab-trigger-primary"
            >
              <SlidersHorizontal className="size-3.5 shrink-0" />
              <span>2. Capability Overrides</span>
              {stats.totalOverrides > 0 && (
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-[10px] py-0 px-1.5 h-4 ml-0.5 font-mono transition-colors",
                    activeTab === "OVERRIDES"
                      ? "tab-badge-primary-active"
                      : "bg-primary/10 text-primary border-primary/20"
                  )}
                >
                  {stats.totalOverrides}
                </Badge>
              )}
              {isOverridesDirty && (
                <span className="size-1.5 rounded-full bg-amber-300 animate-ping" />
              )}
            </TabsTrigger>

            <TabsTrigger
              value="MATRIX"
              className="tab-trigger-primary"
            >
              <Eye className="size-3.5 shrink-0" />
              <span className="hidden sm:inline">3. Effective Matrix</span>
              <span className="sm:hidden">Matrix</span>
              <Badge
                variant="secondary"
                className={cn(
                  "text-[10px] py-0 px-1.5 h-4 ml-0.5 font-mono transition-colors",
                  activeTab === "MATRIX"
                    ? "tab-badge-primary-active"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {activeUser?.isSuperAdmin ? "Root" : stats.totalActive}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Reset All Overrides Shortcut Button (Overrides Tab) */}
          {activeTab === "OVERRIDES" && stats.totalOverrides > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onResetAllOverrides}
              className="h-8 text-[11px] font-medium text-muted-foreground hover:text-destructive gap-1 px-2.5"
            >
              <RotateCcw className="size-3" />
              <span className="hidden sm:inline">Reset All Overrides</span>
            </Button>
          )}
        </div>
      </DialogHeader>
    </div>
  );
}
