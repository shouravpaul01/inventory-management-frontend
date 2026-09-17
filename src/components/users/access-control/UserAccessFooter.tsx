"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Check, Loader2 } from "lucide-react";

interface UserAccessFooterProps {
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onDiscard: () => void;
  onClose: () => void;
  onSave: () => void;
}

export default function UserAccessFooter({
  hasUnsavedChanges,
  isSaving,
  onDiscard,
  onClose,
  onSave,
}: UserAccessFooterProps) {
  return (
    <div className="p-4 border-t bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="text-xs text-muted-foreground">
        {hasUnsavedChanges ? (
          <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1.5">
            <AlertTriangle className="size-3.5 shrink-0" />
            <span>You have unsaved access control changes.</span>
          </span>
        ) : (
          <span className="text-muted-foreground flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
            <span>Access configuration is synchronized with the database.</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {hasUnsavedChanges && (
          <Button
            variant="ghost"
       
            onClick={onDiscard}
            disabled={isSaving}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Discard Changes
          </Button>
        )}

        <Button
          variant="outline"
     
          onClick={onClose}
          disabled={isSaving}
          className="text-xs"
        >
          Close
        </Button>

        <Button
     
          onClick={onSave}
          disabled={!hasUnsavedChanges || isSaving}
          className="text-xs bg-primary gap-1.5 shadow-xs"
        >
          {isSaving ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              <span>Saving Configuration...</span>
            </>
          ) : (
            <>
              <Check className="size-3.5" />
              <span>
                {hasUnsavedChanges
                  ? "Save Configuration Changes"
                  : "No Pending Changes"}
              </span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
