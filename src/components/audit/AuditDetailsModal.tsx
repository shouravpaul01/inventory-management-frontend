"use client";

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
import { TAuditLog } from "@/type";
import {
  ScrollText,
  User,
  Globe,
  Monitor,
  Calendar,
  Layers,
} from "lucide-react";

interface AuditDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log: TAuditLog | null;
}

export default function AuditDetailsModal({
  open,
  onOpenChange,
  log,
}: AuditDetailsModalProps) {
  if (!log) return null;

  const actor = log.actor;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <DialogTitle className="flex items-center gap-2 text-foreground font-bold">
                <ScrollText className="size-5 text-primary" />
                <span>Audit Event Record</span>
              </DialogTitle>
              <DialogDescription>
                Logged on {new Date(log.createdAt).toLocaleString()}
              </DialogDescription>
            </div>

            <Badge variant="outline" className="text-xs uppercase font-mono">
              {log.action}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-lg border bg-muted/20 text-xs">
            <div className="space-y-1">
              <span className="text-muted-foreground block font-medium">Actor Information:</span>
              <p className="font-semibold text-foreground">
                {actor ? `${actor.firstName} ${actor.lastName}` : "System Automated Action"}
              </p>
              {actor?.email && <p className="text-muted-foreground">{actor.email}</p>}
              {log.actorId && (
                <p className="font-mono text-[11px] text-muted-foreground">ID: {log.actorId}</p>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-muted-foreground block font-medium">Target Entity:</span>
              <p className="font-semibold text-foreground">
                {log.module} / {log.entityType}
              </p>
              <p className="font-mono text-[11px] text-muted-foreground">
                Entity ID: {log.entityId || "N/A"}
              </p>
            </div>

            <div className="space-y-1 border-t pt-2 mt-1">
              <span className="text-muted-foreground block font-medium">Network Context:</span>
              <div className="flex items-center gap-1.5 font-mono text-muted-foreground">
                <Globe className="size-3" />
                <span>IP: {log.ipAddress || "127.0.0.1"}</span>
              </div>
            </div>

            <div className="space-y-1 border-t pt-2 mt-1">
              <span className="text-muted-foreground block font-medium">Client User Agent:</span>
              <div className="flex items-center gap-1.5 text-muted-foreground truncate max-w-xs" title={log.userAgent || ""}>
                <Monitor className="size-3 shrink-0" />
                <span className="truncate">{log.userAgent || "Internal API Client"}</span>
              </div>
            </div>
          </div>

          {/* Before Data vs After Data Diffs */}
          {(log.beforeData || log.afterData) && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                State Modification Diff
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Before Data */}
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-rose-600 block">
                    Before State:
                  </span>
                  <div className="p-3 rounded-lg border bg-rose-50/40 dark:bg-rose-950/20 text-xs font-mono max-h-48 overflow-y-auto">
                    {log.beforeData ? (
                      <pre className="whitespace-pre-wrap break-all text-[11px]">
                        {JSON.stringify(log.beforeData, null, 2)}
                      </pre>
                    ) : (
                      <span className="text-muted-foreground italic">None (Newly Created)</span>
                    )}
                  </div>
                </div>

                {/* After Data */}
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-emerald-600 block">
                    After State:
                  </span>
                  <div className="p-3 rounded-lg border bg-emerald-50/40 dark:bg-emerald-950/20 text-xs font-mono max-h-48 overflow-y-auto">
                    {log.afterData ? (
                      <pre className="whitespace-pre-wrap break-all text-[11px]">
                        {JSON.stringify(log.afterData, null, 2)}
                      </pre>
                    ) : (
                      <span className="text-muted-foreground italic">None (Entity Deleted)</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Additional Metadata JSON if exists */}
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Action Metadata
              </h4>
              <div className="p-3 rounded-lg border bg-muted/30 text-xs font-mono max-h-40 overflow-y-auto">
                <pre className="whitespace-pre-wrap break-all text-[11px]">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
