"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface UnsavedChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmDiscard: () => void;
}

export default function UnsavedChangesDialog({
  open,
  onOpenChange,
  onConfirmDiscard,
}: UnsavedChangesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-5 space-y-4">
        <DialogHeader className="space-y-2 text-left">
          <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
            <div className="size-9 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="size-5" />
            </div>
            <DialogTitle className="text-base font-bold text-foreground">
              Discard Unsaved Changes?
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            You have modified access control settings (assigned roles or
            capability overrides) that haven&apos;t been saved yet. If you
            leave now, these modifications will be lost.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Keep Editing
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onConfirmDiscard}
            className="text-xs"
          >
            Discard &amp; Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
