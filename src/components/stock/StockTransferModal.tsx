"use client";

import { useState, useEffect } from "react";
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
import { useTransferStockMutation } from "@/redux/api/stockApi";
import { useGetItemsQuery } from "@/redux/api/itemApi";
import { useGetStockLocationsQuery } from "@/redux/api/locationApi";
import { stockTransferSchema, TStockTransferInput } from "@/validation/stock.validation";
import { toast } from "sonner";
import { Loader2, ArrowRightLeft, Upload } from "lucide-react";
import { TStockBalance } from "@/type";
import { handleMutationResult } from "@/lib/notifyMutation";
import SerializedUnitPicker from "./SerializedUnitPicker";

interface StockTransferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultBalance?: TStockBalance | null;
}

export default function StockTransferModal({
  open,
  onOpenChange,
  defaultBalance,
}: StockTransferModalProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);

  const { data: itemsData } = useGetItemsQuery({ limit: 100 });
  const items = itemsData?.data || [];

  const { data: locationsData } = useGetStockLocationsQuery({ limit: 100 });
  const locations = locationsData?.data || [];

  const [transferStock, { isLoading }] = useTransferStockMutation();

  const itemOptions = items.map((item) => ({
    value: item.id,
    label: `${item.name} (${item.code})${item.isReturnable ? " [Returnable]" : ""}${item.trackingType === "SERIALIZED" ? " [Serialized]" : ""}`,
  }));

  const locationOptions = locations.map((loc) => ({
    value: loc.id,
    label: `${loc.name} (${loc.code})`,
  }));

  const methods = useForm<TStockTransferInput>({
    resolver: zodResolver(stockTransferSchema),
    defaultValues: {
      inventoryItemId: defaultBalance?.inventoryItemId || "",
      fromLocationId: defaultBalance?.locationId || "",
      toLocationId: "",
      quantity: 1,
      notes: "",
    },
  });
  const { reset, watch, setValue } = methods;

  const watchItemId = watch("inventoryItemId");
  const watchFromLocationId = watch("fromLocationId");

  const selectedItem = items.find((i) => i.id === watchItemId);
  const isSerialized = selectedItem?.trackingType === "SERIALIZED" || Boolean(selectedItem?.isReturnable);

  useEffect(() => {
    if (!open) {
      setSelectedPhoto(null);
      setPhotoPreview(null);
      setSelectedUnitIds([]);
      return;
    }
    if (defaultBalance) {
      reset({
        inventoryItemId: defaultBalance.inventoryItemId,
        fromLocationId: defaultBalance.locationId,
        toLocationId: "",
        quantity: 1,
        notes: "",
      });
      setSelectedUnitIds([]);
    }
  }, [defaultBalance?.id, open, reset]);

  // Reset selected unit IDs if item or source location changes
  useEffect(() => {
    setSelectedUnitIds([]);
  }, [watchItemId, watchFromLocationId]);

  // Sync quantity form value with selected units count when serialized
  useEffect(() => {
    if (isSerialized) {
      setValue("quantity", selectedUnitIds.length > 0 ? selectedUnitIds.length : 1);
    }
  }, [isSerialized, selectedUnitIds, setValue]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (values: TStockTransferInput) => {
    if (values.fromLocationId === values.toLocationId) {
      toast.error("Source and destination locations cannot be the same.");
      return;
    }

    if (isSerialized && selectedUnitIds.length === 0) {
      toast.error("Please select at least one serialized unit code to transfer.");
      return;
    }

    try {
      const payloadData: any = {
        inventoryItemId: values.inventoryItemId,
        fromLocationId: values.fromLocationId,
        toLocationId: values.toLocationId,
        quantity: isSerialized ? selectedUnitIds.length : Number(values.quantity),
        notes: values.notes || undefined,
      };

      if (isSerialized && selectedUnitIds.length > 0) {
        payloadData.unitIds = selectedUnitIds;
      }

      const formData = new FormData();
      formData.append("data", JSON.stringify(payloadData));
      if (selectedPhoto) {
        formData.append("photo", selectedPhoto);
      }

      const res = await transferStock(formData).unwrap();
      handleMutationResult(res, "Stock transferred successfully between locations.");
      methods.reset();
      setSelectedPhoto(null);
      setPhotoPreview(null);
      setSelectedUnitIds([]);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to transfer stock");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-5 pb-3 border-b bg-card shrink-0">
          <DialogTitle className="flex items-center gap-2 text-blue-600">
            <ArrowRightLeft className="size-5" />
            Internal Stock Transfer
          </DialogTitle>
          <DialogDescription className="text-xs">
            Relocate stock or serialized assets between warehouses, rooms, and department stores.
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0 overflow-hidden">
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
                  name="fromLocationId"
                  label="From (Source Location)"
                  placeholder="Source location"
                  options={locationOptions}
                  required
                />

                <FormSelect
                  name="toLocationId"
                  label="To (Destination Location)"
                  placeholder="Destination location"
                  options={locationOptions}
                  required
                />
              </div>

              {/* Serialized Unit Picker vs Bulk Quantity */}
              {isSerialized ? (
                <SerializedUnitPicker
                  inventoryItemId={watchItemId}
                  locationId={watchFromLocationId}
                  selectedUnitIds={selectedUnitIds}
                  onChange={setSelectedUnitIds}
                  actionLabel="transfer"
                />
              ) : (
                <FormInput
                  name="quantity"
                  label="Transfer Quantity"
                  type="number"
                  placeholder="e.g. 10"
                  required
                />
              )}

              <FormTextarea
                name="notes"
                label="Transfer Remarks (Optional)"
                placeholder="Reason for movement, authorized personnel, or gate pass details..."
              />

              {/* Photo / Transfer Gate Pass Upload */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">
                  Attachment (Gate Pass / Handover Slip)
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-3 py-2 border rounded-md border-dashed cursor-pointer hover:bg-muted/50 text-xs text-muted-foreground transition-colors">
                    <Upload className="size-4" />
                    <span>{selectedPhoto ? selectedPhoto.name : "Upload image"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                  </label>
                  {photoPreview && (
                    <div className="relative size-10 rounded border overflow-hidden shrink-0">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="size-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
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
                disabled={isLoading || (isSerialized && selectedUnitIds.length === 0)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                Confirm Transfer {isSerialized && selectedUnitIds.length > 0 ? `(${selectedUnitIds.length} units)` : ""}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}

