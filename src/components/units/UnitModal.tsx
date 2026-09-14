"use client";

import { useState } from "react";
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
import {
  useCreateUnitMutation,
  useBatchCreateUnitsMutation,
} from "@/redux/api/unitApi";
import { useGetItemsQuery } from "@/redux/api/itemApi";
import { useGetStockLocationsQuery } from "@/redux/api/locationApi";
import {
  createUnitSchema,
  batchCreateUnitSchema,
  TCreateUnitInput,
  TBatchCreateUnitInput,
} from "@/validation/unit.validation";
import { toast } from "sonner";
import { Loader2, QrCode, Layers } from "lucide-react";

interface UnitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultItemId?: string;
}

export default function UnitModal({
  open,
  onOpenChange,
  defaultItemId,
}: UnitModalProps) {
  const [isBatchMode, setIsBatchMode] = useState(false);

  const { data: itemsData } = useGetItemsQuery({
    trackingType: "SERIALIZED",
    limit: 100,
  });
  const { data: locationsData } = useGetStockLocationsQuery({ limit: 100 });

  const [createUnit, { isLoading: isCreatingSingle }] = useCreateUnitMutation();
  const [batchCreateUnits, { isLoading: isCreatingBatch }] =
    useBatchCreateUnitsMutation();

  const isLoading = isCreatingSingle || isCreatingBatch;

  const itemOptions = (itemsData?.data || []).map((i) => ({
    value: i.id,
    label: `${i.name} (${i.code})`,
  }));

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

  const singleMethods = useForm<TCreateUnitInput>({
    resolver: zodResolver(createUnitSchema),
    defaultValues: {
      inventoryItemId: defaultItemId || "",
      uniqueCode: "",
      serialNumber: "",
      barcode: "",
      condition: "NEW",
      locationId: "",
      purchaseDate: "",
      warrantyEndDate: "",
      notes: "",
    },
  });

  const batchMethods = useForm<TBatchCreateUnitInput>({
    resolver: zodResolver(batchCreateUnitSchema),
    defaultValues: {
      inventoryItemId: defaultItemId || "",
      count: 10,
      condition: "NEW",
      locationId: "",
      purchaseDate: "",
      warrantyEndDate: "",
      notes: "",
    },
  });

  const onSingleSubmit = async (data: TCreateUnitInput) => {
    try {
      await createUnit({
        inventoryItemId: data.inventoryItemId,
        uniqueCode: data.uniqueCode?.trim() || undefined,
        serialNumber: data.serialNumber?.trim() || undefined,
        barcode: data.barcode?.trim() || undefined,
        condition: data.condition,
        locationId: data.locationId || undefined,
        purchaseDate: data.purchaseDate || undefined,
        warrantyEndDate: data.warrantyEndDate || undefined,
        notes: data.notes?.trim() || undefined,
      }).unwrap();

      toast.success("Asset unit created with unique barcode 🎉");
      onOpenChange(false);
      singleMethods.reset();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to create unit");
    }
  };

  const onBatchSubmit = async (data: TBatchCreateUnitInput) => {
    try {
      await batchCreateUnits({
        inventoryItemId: data.inventoryItemId,
        count: Number(data.count),
        condition: data.condition,
        locationId: data.locationId || undefined,
        purchaseDate: data.purchaseDate || undefined,
        warrantyEndDate: data.warrantyEndDate || undefined,
        notes: data.notes?.trim() || undefined,
      }).unwrap();

      toast.success(`${data.count} asset units generated successfully 🎉`);
      onOpenChange(false);
      batchMethods.reset();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to batch create units");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="size-5 text-primary" />
              {isBatchMode ? "Batch Generate Asset Units" : "Register Asset Unit"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {isBatchMode
              ? "Generate a sequence of serialized barcodes for identical physical asset units."
              : "Register an individual physical asset with barcode tracking and serial number."}
          </DialogDescription>
        </DialogHeader>

        {/* Toggle Mode */}
        <div className="flex rounded-lg border border-border/70 p-1 bg-muted/40">
          <button
            type="button"
            onClick={() => setIsBatchMode(false)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
              !isBatchMode
                ? "bg-background text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Single Unit Entry
          </button>
          <button
            type="button"
            onClick={() => setIsBatchMode(true)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
              isBatchMode
                ? "bg-background text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Batch Unit Generation (e.g. 10+ Units)
          </button>
        </div>

        {/* SINGLE UNIT FORM */}
        {!isBatchMode ? (
          <FormProvider {...singleMethods}>
            <form
              onSubmit={singleMethods.handleSubmit(onSingleSubmit)}
              className="space-y-4"
            >
              <FormSelect
                name="inventoryItemId"
                label="Asset Item"
                placeholder="Select Asset Item"
                options={itemOptions}
                disabled={isLoading}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormInput
                  name="uniqueCode"
                  label="Asset Code / Barcode (Auto-generated if empty)"
                  placeholder="e.g. AST-000104"
                  disabled={isLoading}
                />
                <FormInput
                  name="serialNumber"
                  label="Manufacturer Serial No. (Optional)"
                  placeholder="e.g. SN-89240192A"
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormSelect
                  name="condition"
                  label="Unit Physical Condition"
                  options={conditionOptions}
                  disabled={isLoading}
                />
                <FormSelect
                  name="locationId"
                  label="Initial Location / Shelf"
                  placeholder="Select Storage Location"
                  options={[{ value: "", label: "Unassigned" }, ...locationOptions]}
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormInput
                  name="purchaseDate"
                  label="Purchase / Commission Date (Optional)"
                  type="date"
                  disabled={isLoading}
                />
                <FormInput
                  name="warrantyEndDate"
                  label="Warranty Expiration Date (Optional)"
                  type="date"
                  disabled={isLoading}
                />
              </div>

              <FormTextarea
                name="notes"
                label="Unit Custody Notes (Optional)"
                placeholder="Equipment accessories included, MAC address, calibration notes"
                disabled={isLoading}
                rows={2}
              />

              <DialogFooter className="pt-2">
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
                      Creating...
                    </>
                  ) : (
                    "Register Unit"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </FormProvider>
        ) : (
          /* BATCH GENERATION FORM */
          <FormProvider {...batchMethods}>
            <form
              onSubmit={batchMethods.handleSubmit(onBatchSubmit)}
              className="space-y-4"
            >
              <FormSelect
                name="inventoryItemId"
                label="Asset Item"
                placeholder="Select Asset Item"
                options={itemOptions}
                disabled={isLoading}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormInput
                  name="count"
                  label="Number of Units to Generate"
                  type="number"
                  placeholder="e.g. 20"
                  disabled={isLoading}
                />
                <FormSelect
                  name="condition"
                  label="Batch Condition"
                  options={conditionOptions}
                  disabled={isLoading}
                />
              </div>

              <FormSelect
                name="locationId"
                label="Initial Storage Location / Room"
                placeholder="Select Storage Location"
                options={[{ value: "", label: "Unassigned" }, ...locationOptions]}
                disabled={isLoading}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormInput
                  name="purchaseDate"
                  label="Batch Commission Date (Optional)"
                  type="date"
                  disabled={isLoading}
                />
                <FormInput
                  name="warrantyEndDate"
                  label="Warranty Expiration (Optional)"
                  type="date"
                  disabled={isLoading}
                />
              </div>

              <FormTextarea
                name="notes"
                label="Batch Delivery Notes (Optional)"
                placeholder="PO number, supplier shipment reference"
                disabled={isLoading}
                rows={2}
              />

              <DialogFooter className="pt-2">
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
                      Generating...
                    </>
                  ) : (
                    "Generate Units"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </FormProvider>
        )}
      </DialogContent>
    </Dialog>
  );
}
