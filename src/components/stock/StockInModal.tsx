"use client";

import { useState, useEffect } from "react";
import { useForm, FormProvider, useFieldArray } from "react-hook-form";
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
import { FormFileUpload } from "@/components/shared/form/FormFileUpload";
import { useStockInMutation } from "@/redux/api/stockApi";
import { useGetItemsQuery } from "@/redux/api/itemApi";
import { useGetStockLocationsQuery } from "@/redux/api/locationApi";
import { stockInSchema, TStockInInput } from "@/validation/stock.validation";
import { toast } from "sonner";
import { Loader2, PlusCircle, ShieldCheck, Sparkles, Hash } from "lucide-react";
import { TStockBalance } from "@/type";
import { handleMutationResult } from "@/lib/notifyMutation";

interface StockInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultBalance?: TStockBalance | null;
}

export default function StockInModal({
  open,
  onOpenChange,
  defaultBalance,
}: StockInModalProps) {
  const { data: itemsData } = useGetItemsQuery({ limit: 100 });
  const items = itemsData?.data || [];

  const { data: locationsData } = useGetStockLocationsQuery({ limit: 100 });
  const locations = locationsData?.data || [];

  const [stockIn, { isLoading }] = useStockInMutation();

  const itemOptions = items.map((item) => ({
    value: item.id,
    label: `${item.name} (${item.code})${item.isReturnable ? " [Returnable]" : ""}${item.trackingType === "SERIALIZED" ? " [Serialized]" : ""}`,
  }));

  const locationOptions = locations.map((loc) => ({
    value: loc.id,
    label: `${loc.name} (${loc.code})`,
  }));

  const typeOptions = [
    { value: "STOCK_IN", label: "Stock Intake (General Receipt)" },
    { value: "PURCHASE", label: "Purchase Delivery (New Procurement)" },
    { value: "INITIAL_STOCK", label: "Initial Inventory Baseline" },
  ];

  const conditionOptions = [
    { value: "NEW", label: "Brand New" },
    { value: "GOOD", label: "Good Working" },
    { value: "FAIR", label: "Fair / Used" },
    { value: "DAMAGED", label: "Defect / Damaged" },
  ];

  const methods = useForm<TStockInInput>({
    resolver: zodResolver(stockInSchema),
    defaultValues: {
      inventoryItemId: defaultBalance?.inventoryItemId || "",
      locationId: defaultBalance?.locationId || "",
      quantity: 1,
      type: "STOCK_IN",
      notes: "",
      units: [],
      photo: null,
    },
  });
  const { getValues, reset, watch } = methods;

  const { fields, replace } = useFieldArray({
    control: methods.control,
    name: "units",
  });

  const watchItemId = watch("inventoryItemId");
  const watchQty = watch("quantity") || 1;

  const selectedItem = items.find((i) => i.id === watchItemId);
  const isSerialized =
    selectedItem?.trackingType === "SERIALIZED" ||
    Boolean(selectedItem?.isReturnable);

  // Sync unit rows with quantity count when serialized
  useEffect(() => {
    if (!isSerialized) {
      if ((getValues("units") || []).length > 0) {
        replace([]);
      }
      return;
    }
    const targetCount = Math.max(1, Math.min(Number(watchQty) || 1, 100));
    const currentUnits = getValues("units") || [];
    if (currentUnits.length === targetCount) return;

    const next = [];
    for (let i = 0; i < targetCount; i++) {
      next.push({
        uniqueCode: "",
        serialNumber: currentUnits[i]?.serialNumber || "",
        condition: (currentUnits[i]?.condition || "NEW") as
          | "NEW"
          | "GOOD"
          | "FAIR"
          | "DAMAGED",
        notes: currentUnits[i]?.notes || "",
      });
    }
    replace(next);
  }, [isSerialized, watchQty, replace, getValues]);

  useEffect(() => {
    if (open && defaultBalance) {
      reset({
        inventoryItemId: defaultBalance.inventoryItemId || "",
        locationId: defaultBalance.locationId || "",
        quantity: 1,
        type: "STOCK_IN",
        notes: "",
        units: [],
        photo: null,
      });
    }
  }, [open, defaultBalance?.id, reset]);

  const onSubmit = async (values: TStockInInput) => {
    try {
      const qty = Number(values.quantity);
      const payloadData: any = {
        inventoryItemId: values.inventoryItemId,
        locationId: values.locationId,
        quantity: qty,
        type: values.type,
        notes: values.notes || undefined,
      };

      if (isSerialized) {
        payloadData.autoGenerateCodes = true;
        payloadData.units = (values.units || []).map((u) => ({
          uniqueCode: undefined, // Always auto-generated on backend
          serialNumber: u.serialNumber?.trim() || undefined,
          condition: u.condition || "NEW",
          notes: u.notes?.trim() || undefined,
        }));
      }

      const formData = new FormData();
      formData.append("data", JSON.stringify(payloadData));
      if (values.photo && values.photo instanceof File) {
        formData.append("photo", values.photo);
      }

      const res = await stockIn(formData).unwrap();
      handleMutationResult(
        res,
        "Stock received and individual asset units registered successfully.",
      );
      methods.reset();
      replace([]);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to process stock intake");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl! max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-5 pb-3 border-b bg-card! shrink-0">
          <DialogTitle className="flex items-center gap-2 text-emerald-600 text-xl!">
            <PlusCircle className="size-5" />
            Stock In (Intake / Purchase)
          </DialogTitle>
          <DialogDescription className="text-xs">
            Record newly received goods, purchase deliveries, and register
            physical asset units.
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 min-h-0 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <FormSelect
                name="inventoryItemId"
                label="Inventory Item"
                placeholder="Select an item"
                options={itemOptions}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormSelect
                  name="locationId"
                  label="Destination Location"
                  placeholder="Select stock location"
                  options={locationOptions}
                  required
                />

                <FormSelect
                  name="type"
                  label="Intake Type"
                  options={typeOptions}
                  required
                />
              </div>

              <FormInput
                name="quantity"
                label={isSerialized ? "Number of Physical Units" : "Quantity"}
                type="number"
                placeholder="e.g. 5"
                required
              />

              {/* Serialized / Returnable Asset Unit Details */}
              {isSerialized && (
                <div className="border rounded-lg p-3.5 bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between gap-2 border-b pb-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      <ShieldCheck className="size-4" />
                      <span>
                        Returnable Asset Unit Registration ({fields.length}{" "}
                        {fields.length === 1 ? "unit" : "units"})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground select-none">
                      <Sparkles className="size-3 text-amber-500" />
                      <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                        Auto-generated Asset Codes
                      </span>
                    </div>
                  </div>

                  <div className=" space-y-3 pr-1">
                    {fields.map((field, idx) => (
                      <div
                        key={field.id}
                        className="p-3 rounded-lg border bg-card space-y-2 shadow-2xs"
                      >
                        <div className="flex items-center justify-between border-b pb-1.5">
                          <span className="font-mono font-bold text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                            Unit #{idx + 1}
                          </span>
                          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                            <Sparkles className="size-3" />
                            Auto-assigned Asset Code
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                          <div className="sm:col-span-4">
                            <FormInput
                              name={`units.${idx}.uniqueCode`}
                              label="Asset Tag / Code"
                              placeholder="(Auto-generated)"
                              disabled
                              startIcon={{ icon: Hash }}
                            />
                          </div>

                          <div className="sm:col-span-5">
                            <FormInput
                              name={`units.${idx}.serialNumber`}
                              label="Hardware Serial #"
                              placeholder="e.g. SN-998822"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <FormSelect
                              name={`units.${idx}.condition`}
                              label="Condition"
                              options={conditionOptions}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] text-muted-foreground italic">
                    Each physical unit will be uniquely registered in storage
                    and available for requisition distribution and return
                    tracking.
                  </p>
                </div>
              )}

              <FormTextarea
                name="notes"
                label="Delivery / Invoice Notes (Optional)"
                placeholder="Purchase Order #, delivery challan reference, or supplier remarks..."
              />

              {/* Photo / Invoice Upload */}
              <FormFileUpload
                name="photo"
                label="Attachment (Delivery Note / Invoice Photo)"
                description="Upload evidence photo of physical delivery note, invoice, or received package"
                mode="image"
                maxSizeMB={5}
                height="h-28"
                className="dark:bg-card/40"
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
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                Confirm Stock In
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
