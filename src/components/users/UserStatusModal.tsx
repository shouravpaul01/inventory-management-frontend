"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUpdateUserStatusMutation } from "@/redux/api/userApi";
import { TUser, TUserStatus } from "@/type";
import { toast } from "sonner";
import { Loader2, ShieldAlert } from "lucide-react";

interface UserStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: TUser | null;
}

export default function UserStatusModal({
  open,
  onOpenChange,
  user,
}: UserStatusModalProps) {
  const [status, setStatus] = useState<TUserStatus>(user?.status || "ACTIVE");
  const [updateStatus, { isLoading }] = useUpdateUserStatusMutation();

  useEffect(() => {
    if (open && user?.status) {
      setStatus(user.status);
    }
  }, [open, user?.id, user?.status]);

  const handleSave = async () => {
    if (!user) return;
    try {
      await updateStatus({ id: user.id, status }).unwrap();
      toast.success(`User status changed to ${status}`);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update user status");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="size-5 text-amber-500" />
            Manage Account Status
          </DialogTitle>
          <DialogDescription>
            Change authorization state for{" "}
            <strong className="text-foreground">
              {user?.firstName} {user?.lastName || ""}
            </strong>{" "}
            ({user?.email}).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="grid grid-cols-3 gap-2">
            {(["ACTIVE", "INACTIVE", "SUSPENDED"] as TUserStatus[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                  status === s
                    ? s === "ACTIVE"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : s === "SUSPENDED"
                      ? "border-rose-600 bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                      : "border-slate-600 bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                    : "border-border hover:bg-muted text-muted-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <p className="text-[11px] text-muted-foreground">
            {status === "ACTIVE" &&
              "User can sign in normally and perform allowed inventory operations."}
            {status === "INACTIVE" &&
              "User access is disabled temporarily. Data and records remain intact."}
            {status === "SUSPENDED" &&
              "User account is locked due to security policy or pending investigation."}
          </p>
        </div>

        <DialogFooter>
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
                Saving...
              </>
            ) : (
              "Update Status"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
