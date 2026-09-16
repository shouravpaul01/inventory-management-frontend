"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useGetRolesQuery } from "@/redux/api/rbacApi";
import {
  useGetUserByIdQuery,
  useAssignUserRolesMutation,
} from "@/redux/api/userApi";
import { TUser } from "@/type";
import { toast } from "sonner";
import {
  Loader2,
  Shield,
  Search,
  Check,
  Building2,
  ShieldAlert,
  KeyRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserRolesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: TUser | null;
}

export default function UserRolesModal({
  open,
  onOpenChange,
  user,
}: UserRolesModalProps) {
  // Always fetch fresh user data to ensure accurate role IDs
  const { data: freshUserData, isLoading: isUserLoading } = useGetUserByIdQuery(
    user?.id || "",
    { skip: !user?.id || !open }
  );
  const activeUser = freshUserData?.data || user;

  const { data: rolesData, isLoading: isRolesLoading } = useGetRolesQuery();
  const [assignUserRoles, { isLoading: isSaving }] =
    useAssignUserRolesMutation();

  const allRoles = rolesData?.data || [];
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Synchronize selected roles when user data loads or modal opens
  useEffect(() => {
    if (!open) return;
    if (activeUser && Array.isArray(activeUser.roles)) {
      const currentIds = activeUser.roles
        .map((r: any) =>
          typeof r === "string" ? r : r.roleId || r.role?.id || r.id
        )
        .filter((id): id is string => Boolean(id));
      setSelectedRoleIds(currentIds);
    } else {
      setSelectedRoleIds([]);
    }
    setSearchTerm("");
  }, [activeUser?.id, open]);

  const filteredRoles = useMemo(() => {
    if (!searchTerm.trim()) return allRoles;
    const term = searchTerm.toLowerCase();
    return allRoles.filter(
      (r) =>
        r.name.toLowerCase().includes(term) ||
        r.code.toLowerCase().includes(term) ||
        (r.description && r.description.toLowerCase().includes(term))
    );
  }, [allRoles, searchTerm]);

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleSelectAll = () => {
    setSelectedRoleIds(allRoles.map((r) => r.id));
  };

  const handleClearAll = () => {
    setSelectedRoleIds([]);
  };

  const handleSave = async () => {
    if (!activeUser) return;
    try {
      await assignUserRoles({
        id: activeUser.id,
        roleIds: selectedRoleIds,
      }).unwrap();

      toast.success(
        `Successfully updated roles for ${activeUser.firstName} (${selectedRoleIds.length} assigned)`
      );
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update assigned roles");
    }
  };

  const initials =
    activeUser?.firstName && activeUser?.lastName
      ? `${activeUser.firstName[0]}${activeUser.lastName[0]}`.toUpperCase()
      : (activeUser?.username || "U").slice(0, 2).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 pb-4 border-b bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <KeyRound className="size-5 text-primary" />
              Manage User Roles
            </DialogTitle>
            <DialogDescription className="text-xs">
              Assign or revoke institutional roles for this staff member to control default system permissions.
            </DialogDescription>
          </DialogHeader>

          {/* User Profile Card */}
          {activeUser && (
            <div className="mt-3.5 p-3 rounded-lg border bg-muted/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar className="size-9 shrink-0 border border-border">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-xs text-foreground truncate">
                      {activeUser.firstName} {activeUser.lastName || ""}
                    </span>
                    <Badge variant="outline" className="font-mono text-[10px] py-0 px-1.5">
                      {activeUser.employeeId}
                    </Badge>
                    {activeUser.isSuperAdmin && (
                      <Badge
                        variant="secondary"
                        className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] px-1.5 py-0"
                      >
                        Super Admin
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5 truncate">
                    <span>{activeUser.email}</span>
                    {activeUser.department && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 truncate">
                          <Building2 className="size-3 shrink-0" />
                          {activeUser.department.name}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                  Assigned
                </span>
                <span className="text-xs font-bold text-primary">
                  {selectedRoleIds.length} of {allRoles.length} Roles
                </span>
              </div>
            </div>
          )}

          {activeUser?.isSuperAdmin && (
            <div className="mt-2.5 p-2 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] flex items-center gap-2">
              <ShieldAlert className="size-4 shrink-0 text-amber-600" />
              <span>
                Note: Super Admin automatically bypasses all permission restrictions, but assigned roles still govern workflow approvals and policy assignment.
              </span>
            </div>
          )}
        </div>

        {/* Filter and Role List */}
        <div className="p-4 space-y-3 flex-1 overflow-y-auto bg-muted/10">
          <div className="flex items-center justify-between gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search roles by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-xs bg-background"
              />
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={handleSelectAll}
                className="text-[11px] h-7 px-2"
              >
                Select All
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={handleClearAll}
                className="text-[11px] h-7 px-2 text-muted-foreground"
              >
                Clear
              </Button>
            </div>
          </div>

          {isRolesLoading || isUserLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
              <Loader2 className="size-5 animate-spin text-primary" />
              <span>Loading institutional roles...</span>
            </div>
          ) : filteredRoles.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No matching roles found for &quot;{searchTerm}&quot;.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredRoles.map((role) => {
                const isSelected = selectedRoleIds.includes(role.id);
                const permCount = role.permissions?.length || 0;

                return (
                  <div
                    key={role.id}
                    onClick={() => toggleRole(role.id)}
                    className={cn(
                      "p-3 rounded-lg border transition-all cursor-pointer flex items-start justify-between gap-3 select-none",
                      isSelected
                        ? "bg-primary/5 border-primary/40 shadow-2xs"
                        : "bg-card border-border hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={cn(
                          "size-4.5 rounded border mt-0.5 flex items-center justify-center transition-colors shrink-0",
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-input bg-background"
                        )}
                      >
                        {isSelected && <Check className="size-3 stroke-[3]" />}
                      </div>

                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-xs text-foreground">
                            {role.name}
                          </span>
                          <Badge variant="outline" className="font-mono text-[9px] py-0 px-1.5">
                            {role.code}
                          </Badge>
                          {role.isSystem && (
                            <Badge
                              variant="secondary"
                              className="text-[9px] py-0 px-1 text-slate-600 dark:text-slate-400"
                            >
                              SYSTEM
                            </Badge>
                          )}
                        </div>

                        {role.description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-1">
                            {role.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
                      <Shield className="size-3 text-muted-foreground" />
                      <span>{permCount} perms</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-card flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            <span className="font-bold text-foreground">{selectedRoleIds.length}</span> role(s) selected
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isSaving || isRolesLoading || isUserLoading}
              className="text-xs bg-primary gap-1.5"
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Saving Roles...</span>
                </>
              ) : (
                <span>Save Assigned Roles</span>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
