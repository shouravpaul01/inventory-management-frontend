"use client";

import { useState, useEffect, useRef } from "react";
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
import { FormFileUpload } from "@/components/shared/form/FormFileUpload";
import { useStockOutMutation } from "@/redux/api/stockApi";
import { useGetItemsQuery } from "@/redux/api/itemApi";
import { useGetStockLocationsQuery } from "@/redux/api/locationApi";
import { stockOutSchema, TStockOutInput } from "@/validation/stock.validation";
import { toast } from "sonner";
import { Loader2, MinusCircle } from "lucide-react";
import { TStockBalance } from "@/type";
import SerializedUnitPicker from "./SerializedUnitPicker";

interface StockOutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultBalance?: TStockBalance | null;
}

export default function StockOutModal({
  open,
  onOpenChange,
  defaultBalance,
}: StockOutModalProps) {
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);

  const { data: itemsData } = useGetItemsQuery({ limit: 100 });
  const items = itemsData?.data || [];

  const { data: locationsData } = useGetStockLocationsQuery({ limit: 100 });
  const locations = locationsData?.data || [];

  const [stockOut, { isLoading }] = useStockOutMutation();

  const itemOptions = items.map((item) => ({
    value: item.id,
    label: `${item.name} (${item.code})${item.isReturnable ? " [Returnable]" : ""}${item.trackingType === "SERIALIZED" ? " [Serialized]" : ""}`,
  }));

  const locationOptions = locations.map((loc) => ({
    value: loc.id,
    label: `${loc.name} (${loc.code})`,
  }));

  const typeOptions = [
    { value: "STOCK_OUT", label: "General Stock Out / Consumption" },
    { value: "DAMAGE", label: "Damaged / Broken Goods" },
    { value: "LOSS", label: "Inventory Loss / Missing" },
    { value: "DISPOSAL", label: "Scrap / Formal Disposal" },
    { value: "GIFT", label: "Institutional Gift / Donated" },
  ];

  const methods = useForm<TStockOutInput>({
    resolver: zodResolver(stockOutSchema),
    defaultValues: {
      inventoryItemId: defaultBalance?.inventoryItemId || "",
      locationId: defaultBalance?.locationId || "",
      quantity: 1,
      type: "STOCK_OUT",
      notes: "",
      photo: null,
    },
  });
  const { reset, watch, setValue, getValues } = methods;

  const watchItemId = watch("inventoryItemId");
  const watchLocationId = watch("locationId");

  const selectedItem = items.find((i) => i.id === watchItemId);
  const isSerialized =
    selectedItem?.trackingType === "SERIALIZED" ||
    Boolean(selectedItem?.isReturnable);

  useEffect(() => {
    if (!open) {
      setSelectedUnitIds((prev) => (prev.length === 0 ? prev : []));
      return;
    }
    if (defaultBalance) {
      reset({
        inventoryItemId: defaultBalance.inventoryItemId,
        locationId: defaultBalance.locationId,
        quantity: 1,
        type: "STOCK_OUT",
        notes: "",
        photo: null,
      });
      setSelectedUnitIds((prev) => (prev.length === 0 ? prev : []));
    }
  }, [defaultBalance?.id, open]);

  // Reset selected units if item or location changes
  const prevRef = useRef({ itemId: watchItemId, locId: watchLocationId });
  useEffect(() => {
    if (
      prevRef.current.itemId !== watchItemId ||
      prevRef.current.locId !== watchLocationId
    ) {
      prevRef.current = { itemId: watchItemId, locId: watchLocationId };
      setSelectedUnitIds((prev) => (prev.length === 0 ? prev : []));
    }
  }, [watchItemId, watchLocationId]);

  // Sync quantity form value with selected units count when serialized
  useEffect(() => {
    if (isSerialized) {
      const targetQty = selectedUnitIds.length > 0 ? selectedUnitIds.length : 1;
      if (Number(getValues("quantity")) !== targetQty) {
        setValue("quantity", targetQty);
      }
    }
  }, [isSerialized, selectedUnitIds, setValue, getValues]);

  const onSubmit = async (values: TStockOutInput) => {
    if (isSerialized && selectedUnitIds.length === 0) {
      toast.error(
        "Please select at least one serialized unit code to deduct/write-off.",
      );
      return;
    }

    try {
      const payloadData: any = {
        inventoryItemId: values.inventoryItemId,
        locationId: values.locationId,
        quantity: isSerialized
          ? selectedUnitIds.length
          : Number(values.quantity),
        type: values.type,
        notes: values.notes || undefined,
      };

      if (isSerialized && selectedUnitIds.length > 0) {
        payloadData.unitIds = selectedUnitIds;
      }

      const formData = new FormData();
      formData.append("data", JSON.stringify(payloadData));
      if (values.photo && values.photo instanceof File) {
        formData.append("photo", values.photo);
      }

      await stockOut(formData).unwrap();
      toast.success("Stock deducted and asset movement recorded successfully.");
      methods.reset();
      setSelectedUnitIds([]);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to process stock deduction");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl! max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-5 pb-3 border-b bg-card shrink-0">
          <DialogTitle className="flex items-center gap-2 text-rose-600 text-xl!">
            <MinusCircle className="size-5" />
            Stock Out (Deduction / Disposal)
          </DialogTitle>
          <DialogDescription className="text-xs">
            Record inventory write-offs, damaged stock disposal, or asset
            consumption.
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
                  label="Source Location"
                  placeholder="Select location"
                  options={locationOptions}
                  required
                />

                <FormSelect
                  name="type"
                  label="Deduction Reason"
                  options={typeOptions}
                  required
                />
              </div>

              {/* Serialized Unit Picker vs Bulk Quantity */}
              {isSerialized ? (
                <SerializedUnitPicker
                  inventoryItemId={watchItemId}
                  locationId={watchLocationId}
                  selectedUnitIds={selectedUnitIds}
                  onChange={setSelectedUnitIds}
                  actionLabel="write-off / deduct"
                />
              ) : (
                <FormInput
                  name="quantity"
                  label="Quantity to Deduct"
                  type="number"
                  placeholder="e.g. 5"
                  required
                />
              )}

              <FormTextarea
                name="notes"
                label="Justification / Inspection Notes"
                placeholder="Reason for write-off, incident report #, or disposal committee approval..."
              />

              {/* Photo Upload */}
              <FormFileUpload
                name="photo"
                label="Attachment (Damage / Disposal Evidence)"
                description="Upload evidence photo of damaged items, disposal certificate, or incident report"
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
                disabled={
                  isLoading || (isSerialized && selectedUnitIds.length === 0)
                }
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                Confirm Stock Out{" "}
                {isSerialized && selectedUnitIds.length > 0
                  ? `(${selectedUnitIds.length} units)`
                  : ""}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
