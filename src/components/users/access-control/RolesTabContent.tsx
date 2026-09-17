"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SearchInput from "@/components/shared/SearchInput";
import { TRole } from "@/type";
import {
  KeyRound,
  Check,
  CheckCircle2,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RolesTabContentProps {
  filteredRoles: TRole[];
  selectedRoleIds: string[];
  roleSearchTerm: string;
  setRoleSearchTerm: (term: string) => void;
  isRolesLoading: boolean;
  isUserLoading: boolean;
  toggleRole: (roleId: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  onNavigateToOverrides: () => void;
}

export default function RolesTabContent({
  filteredRoles,
  selectedRoleIds,
  roleSearchTerm,
  setRoleSearchTerm,
  isRolesLoading,
  isUserLoading,
  toggleRole,
  onSelectAll,
  onClearAll,
  onNavigateToOverrides,
}: RolesTabContentProps) {
  return (
    <div className="space-y-4">
      {/* Informational Guidance Card */}
      <Card className="border-primary/20 bg-primary/5 p-4 gap-2 shadow-2xs">
        <CardContent className="p-0 flex items-start gap-3">
          <KeyRound className="size-4 shrink-0 text-primary mt-0.5" />
          <div className="space-y-1">
            <CardTitle className="font-semibold text-xs text-foreground">
              Institutional Role Hierarchy
            </CardTitle>
            <CardDescription className="text-[11px] text-muted-foreground leading-relaxed">
              Assigned roles confer baseline system privileges. Permissions
              granted by these roles automatically apply to the staff member
              unless explicitly blocked in the <b>Capability Overrides</b> tab.
            </CardDescription>
          </div>
        </CardContent>
      </Card>

      {/* Roles Search & Quick Batch Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="w-full sm:w-80">
          <SearchInput
            value={roleSearchTerm}
            onChange={setRoleSearchTerm}
            placeholder="Search roles by title or code..."
            className="h-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onSelectAll}
            className="h-9 text-xs font-medium"
          >
            Select All Roles
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-9 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear Selection
          </Button>
        </div>
      </div>

      {/* Roles Grid using shadcn Cards */}
      {isRolesLoading || isUserLoading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-5 animate-spin text-primary" />
          <span>Loading institutional roles...</span>
        </div>
      ) : filteredRoles.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground border border-dashed rounded-xl">
          <span>No roles match your search term &ldquo;{roleSearchTerm}&rdquo;.</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRoleSearchTerm("")}
            className="text-xs text-primary"
          >
            Clear Search
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredRoles.map((role) => {
            const isSelected = selectedRoleIds.includes(role.id);
            const permsCount = Array.isArray(role.permissions)
              ? role.permissions.length
              : 0;

            return (
              <Card
                key={role.id}
                onClick={() => toggleRole(role.id)}
                className={cn(
                  "p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 select-none py-4 group",
                  isSelected
                    ? "bg-primary/5 dark:bg-primary/10 border-primary ring-1 ring-primary/40 shadow-xs"
                    : "bg-card hover:bg-muted/40 border-border/80 hover:border-primary/40"
                )}
              >
                <CardContent className="p-0 space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={cn(
                            "size-5 rounded-md border flex items-center justify-center transition-colors shrink-0",
                            isSelected
                              ? "bg-primary border-primary text-primary-foreground shadow-xs"
                              : "border-muted-foreground/40 bg-background group-hover:border-primary/60"
                          )}
                        >
                          {isSelected && (
                            <Check className="size-3.5 stroke-[3]" />
                          )}
                        </div>

                        <CardTitle className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors truncate">
                          {role.name}
                        </CardTitle>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge
                          variant="outline"
                          className="font-mono text-[9px] px-1.5 py-0 text-muted-foreground"
                        >
                          {role.code}
                        </Badge>
                        {(role.isSystem || (role as any).isSystemRole) && (
                          <Badge
                            variant="secondary"
                            className="text-[9px] py-0 px-1 font-semibold"
                          >
                            System
                          </Badge>
                        )}
                      </div>
                    </div>

                    {role.description && (
                      <CardDescription className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed pl-7.5">
                        {role.description}
                      </CardDescription>
                    )}
                  </div>

                  <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="size-3 text-primary" />
                      <span>Bundles {permsCount} capabilities</span>
                    </span>

                    <span
                      className={cn(
                        "font-bold text-[10px]",
                        isSelected ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {isSelected ? "Assigned" : "Not Assigned"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Next Step Transition Banner */}
      <div className="pt-2 flex items-center justify-between p-3 rounded-xl border bg-muted/20 text-xs">
        <div className="text-muted-foreground">
          Want to fine-tune individual permissions granted by these roles?
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onNavigateToOverrides}
          className="h-7 text-xs font-semibold text-primary hover:text-primary/80 gap-1"
        >
          <span>Go to Capability Overrides</span>
          <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
