"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Controller } from "react-hook-form";


interface TermsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  control: any;
  setValue: any;
}

export default function TermsDialog({
  open,
  onOpenChange,
  control,
  setValue,
}: TermsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
        {/* HEADER */}
        <DialogHeader className="p-5 pb-3 border-b bg-card shrink-0">
          <DialogTitle className="text-lg font-semibold">Terms & Conditions</DialogTitle>
        </DialogHeader>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* <TermsAndConditionCard /> */}
        </div>

        {/* FOOTER */}
        <DialogFooter className="p-4 border-t bg-card shrink-0 flex justify-center! items-center!">
          <Controller
            name="isAgree"
            control={control}
            render={({ field }) => (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(value) => {
                    field.onChange(value);

                    setValue("isAgree", value, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });

                    if (value) {
                      onOpenChange(false);
                    }
                  }}
                />

                <Label className="text-sm text-muted-foreground">
                  I agree to Terms & Conditions
                </Label>
              </div>
            )}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
