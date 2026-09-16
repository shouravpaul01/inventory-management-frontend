"use client";

import { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/shared/form/FormInput";
import { FormTextarea } from "@/components/shared/form/FormTextarea";
import { FormSelect } from "@/components/shared/form/FormSelect";
import { useUpdateUnitMutation } from "@/redux/api/unitApi";
import { useGetStockLocationsQuery } from "@/redux/api/locationApi";
import { updateUnitSchema, TUpdateUnitInput } from "@/validation/unit.validation";
import { toast } from "sonner";
import { Loader2, QrCode } from "lucide-react";
import { TInventoryUnit } from "@/type";

interface UnitUpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit: TInventoryUnit | null;
}

export default function UnitUpdateModal({
  open,
  onOpenChange,
  unit,
}: UnitUpdateModalProps) {
  const { data: locationsData } = useGetStockLocationsQuery({ limit: 100 });
  const [updateUnit, { isLoading }] = useUpdateUnitMutation();

  const locationOptions = (locationsData?.data || []).map((loc) => ({
    value: loc.id,
    label: `${loc.name} (${loc.code})`,
  }));

  const conditionOptions = [
    { value: "NEW", label: "New (Brand New / Unused)" },
    { value: "GOOD", label: "Good (Fully functional, minimal wear)" },
    { value: "FAIR", label: "Fair (Functional with cosmetic wear)" },
    { value: "POOR", label: "Poor (Degraded performance / maintenance needed)" },
    { value: "DAMAGED", label: "Damaged (Inoperable / requires repair)" },
  ];

  const methods = useForm<TUpdateUnitInput>({
    resolver: zodResolver(updateUnitSchema),
    defaultValues: {
      serialNumber: "",
      barcode: "",
      condition: "GOOD",
      locationId: "",
      warrantyEndDate: "",
      notes: "",
    },
  });
  const { reset } = methods;

  useEffect(() => {
    if (!open) return;
    if (unit) {
      reset({
        serialNumber: unit.serialNumber || "",
        barcode: unit.barcode || "",
        condition: unit.condition || "GOOD",
        locationId: unit.locationId || "",
        warrantyEndDate: unit.warrantyEndDate || "",
        notes: unit.notes || "",
      });
    }
  }, [unit?.id, open, reset]);

  const onSubmit = async (data: TUpdateUnitInput) => {
    if (!unit) return;
    try {
      await updateUnit({
        id: unit.id,
        body: {
          serialNumber: data.serialNumber?.trim() || undefined,
          barcode: data.barcode?.trim() || undefined,
          condition: data.condition,
          locationId: data.locationId || undefined,
          warrantyEndDate: data.warrantyEndDate || undefined,
          notes: data.notes?.trim() || undefined,
        },
      }).unwrap();

      toast.success("Asset unit updated successfully 🎉");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update unit");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-5 pb-3 border-b bg-card shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="size-5 text-primary" />
            Update Asset Unit: {unit?.uniqueCode}
          </DialogTitle>
          <DialogDescription>
            Modify custody location, condition status, or serial records.
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormInput
                name="serialNumber"
                label="Serial Number"
                placeholder="e.g. SN-89240192A"
                disabled={isLoading}
              />
              <FormInput
                name="barcode"
                label="Barcode / RFID Tag"
                placeholder="e.g. 1049283749"
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormSelect
                name="condition"
                label="Physical Condition"
                options={conditionOptions}
                disabled={isLoading}
              />

              <FormSelect
                name="locationId"
                label="Current Location"
                placeholder="Select Location"
                options={[{ value: "", label: "Unassigned" }, ...locationOptions]}
                disabled={isLoading}
              />
            </div>

            <FormInput
              name="warrantyEndDate"
              label="Warranty Expiration"
              type="date"
              disabled={isLoading}
            />

            <FormTextarea
              name="notes"
              label="Custody / Maintenance Notes"
              placeholder="Inspection results, damage description, or service log"
              disabled={isLoading}
              rows={2}
            />
            </div>

            <DialogFooter className="p-4 border-t bg-card shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Save Unit Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
