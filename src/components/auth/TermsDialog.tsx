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
      <DialogContent className="max-w-5xl! flex flex-col  p-0 overflow-hidden">
        {/* HEADER */}
        <DialogHeader className="px-6 py-4 border-b bg-white">
          <DialogTitle className="text-lg font-semibold">Terms & Conditions</DialogTitle>
        </DialogHeader>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 max-h-[80vh] overflow-y-auto  px-6 py-4">
          {/* <TermsAndConditionCard /> */}
        </div>

        {/* FOOTER */}
        <DialogFooter className="flex justify-center! items-center! pb-10 bg-white">
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
