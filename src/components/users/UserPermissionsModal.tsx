"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGetPermissionsQuery } from "@/redux/api/rbacApi";
import { useOverrideUserPermissionsMutation } from "@/redux/api/userApi";
import { TPermission, TUser } from "@/type";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";

interface UserPermissionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: TUser | null;
}

export default function UserPermissionsModal({
  open,
  onOpenChange,
  user,
}: UserPermissionsModalProps) {
  const { data: permsData } = useGetPermissionsQuery({ limit: 200 });
  const [overrideUserPermissions, { isLoading }] =
    useOverrideUserPermissionsMutation();

  const permissions = permsData?.data || [];

  // Map of permissionId -> "GRANT" | "REVOKE" | "DEFAULT"
  const [overrideMap, setOverrideMap] = useState<
    Record<string, "GRANT" | "REVOKE" | "DEFAULT">
  >({});

  useEffect(() => {
    if (!open) return;
    if (user && Array.isArray(user.permissions)) {
      const initial: Record<string, "GRANT" | "REVOKE" | "DEFAULT"> = {};
      user.permissions.forEach((up: any) => {
        if (up.permissionId) {
          initial[up.permissionId] = up.granted ? "GRANT" : "REVOKE";
        }
      });
      setOverrideMap(initial);
    } else {
      setOverrideMap({});
    }
  }, [user?.id, open]);

  // Group permissions by module
  const modules = Array.from(new Set(permissions.map((p) => p.module))).sort();

  const handleSetState = (
    permissionId: string,
    state: "GRANT" | "REVOKE" | "DEFAULT"
  ) => {
    setOverrideMap((prev) => ({
      ...prev,
      [permissionId]: state,
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      const overrides = Object.entries(overrideMap)
        .filter(([_, effect]) => effect === "GRANT" || effect === "REVOKE")
        .map(([permissionId, effect]) => ({
          permissionId,
          effect: effect as "GRANT" | "REVOKE",
        }));

      await overrideUserPermissions({
        id: user.id,
        overrides,
      }).unwrap();

      toast.success("User permission overrides saved successfully 🎉");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update overrides");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            Explicit Permission Overrides
          </DialogTitle>
          <DialogDescription>
            Grant or revoke specific capabilities for{" "}
            <strong className="text-foreground">
              {user?.firstName} {user?.lastName || ""}
            </strong>{" "}
            ({user?.employeeId}) beyond their assigned role defaults.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
          {modules.map((moduleName) => {
            const modulePerms = permissions.filter(
              (p) => p.module === moduleName
            );

            return (
              <div
                key={moduleName}
                className="rounded-lg border border-border/70 p-3 space-y-2 bg-card"
              >
                <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {moduleName} Module
                  </span>
                  <Badge variant="outline" className="text-[10px] py-0">
                    {modulePerms.length} capabilities
                  </Badge>
                </div>

                <div className="space-y-1.5">
                  {modulePerms.map((perm) => {
                    const current = overrideMap[perm.id] || "DEFAULT";

                    return (
                      <div
                        key={perm.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-1.5 rounded hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-foreground">
                            {perm.name}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {perm.code}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleSetState(perm.id, "GRANT")}
                            className={`px-2 py-0.5 text-[10px] font-semibold rounded border transition-all ${
                              current === "GRANT"
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : "text-muted-foreground border-border hover:bg-muted"
                            }`}
                          >
                            Grant
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetState(perm.id, "REVOKE")}
                            className={`px-2 py-0.5 text-[10px] font-semibold rounded border transition-all ${
                              current === "REVOKE"
                                ? "bg-rose-600 text-white border-rose-600"
                                : "text-muted-foreground border-border hover:bg-muted"
                            }`}
                          >
                            Revoke
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetState(perm.id, "DEFAULT")}
                            className={`px-2 py-0.5 text-[10px] font-semibold rounded border transition-all ${
                              current === "DEFAULT"
                                ? "bg-muted text-foreground border-border font-bold"
                                : "text-muted-foreground border-border hover:bg-muted"
                            }`}
                          >
                            Role Default
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className="pt-2 border-t border-border/60">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Saving Overrides...
              </>
            ) : (
              "Save Permission Overrides"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
