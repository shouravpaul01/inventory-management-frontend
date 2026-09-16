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
import { useAdjustStockMutation } from "@/redux/api/stockApi";
import { useGetItemsQuery } from "@/redux/api/itemApi";
import { useGetStockLocationsQuery } from "@/redux/api/locationApi";
import { stockAdjustSchema, TStockAdjustInput } from "@/validation/stock.validation";
import { toast } from "sonner";
import { Loader2, SlidersHorizontal, Upload, AlertCircle } from "lucide-react";
import { TStockBalance } from "@/type";
import { handleMutationResult } from "@/lib/notifyMutation";

interface StockAdjustModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balance: TStockBalance | null;
}

export default function StockAdjustModal({
  open,
  onOpenChange,
  balance,
}: StockAdjustModalProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const { data: itemsData } = useGetItemsQuery({ limit: 100 });
  const items = itemsData?.data || [];

  const { data: locationsData } = useGetStockLocationsQuery({ limit: 100 });
  const locations = locationsData?.data || [];

  const [adjustStock, { isLoading }] = useAdjustStockMutation();

  const itemOptions = items.map((item) => ({
    value: item.id,
    label: `${item.name} (${item.code})`,
  }));

  const locationOptions = locations.map((loc) => ({
    value: loc.id,
    label: `${loc.name} (${loc.code})`,
  }));

  const methods = useForm<TStockAdjustInput>({
    resolver: zodResolver(stockAdjustSchema),
    defaultValues: {
      inventoryItemId: balance?.inventoryItemId || "",
      locationId: balance?.locationId || "",
      newQuantity: balance?.quantity || 0,
      notes: "",
    },
  });

  const { watch, reset } = methods;
  const newQty = watch("newQuantity");

  useEffect(() => {
    if (!open) return;
    if (balance) {
      reset({
        inventoryItemId: balance.inventoryItemId,
        locationId: balance.locationId,
        newQuantity: balance.quantity,
        notes: "",
      });
    }
  }, [balance?.id, open, reset]);

  const currentQty = balance?.quantity ?? 0;
  const delta = (Number(newQty) || 0) - currentQty;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (values: TStockAdjustInput) => {
    try {
      const formData = new FormData();
      formData.append(
        "data",
        JSON.stringify({
          inventoryItemId: values.inventoryItemId,
          locationId: values.locationId,
          newQuantity: Number(values.newQuantity),
          notes: values.notes,
        })
      );
      if (selectedPhoto) {
        formData.append("photo", selectedPhoto);
      }

      const res = await adjustStock(formData).unwrap();
      handleMutationResult(res, "Stock balance adjusted and audit record logged.");
      reset();
      setSelectedPhoto(null);
      setPhotoPreview(null);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to adjust stock balance");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <SlidersHorizontal className="size-5" />
            Stock Adjustment & Reconciliation
          </DialogTitle>
          <DialogDescription>
            Audit count discrepancy adjustment. Modifying stock creates a permanent audit movement log.
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormSelect
              name="inventoryItemId"
              label="Inventory Item"
              placeholder="Select an item"
              options={itemOptions}
              disabled={!!balance}
              required
            />

            <FormSelect
              name="locationId"
              label="Stock Location"
              placeholder="Select location"
              options={locationOptions}
              disabled={!!balance}
              required
            />

            {/* Current vs New Quantity comparison */}
            <div className="p-3.5 rounded-lg border bg-muted/30 flex items-center justify-between text-xs">
              <div>
                <span className="text-muted-foreground block">System Count:</span>
                <span className="font-bold text-sm text-foreground">{currentQty}</span>
              </div>

              <div className="text-right">
                <span className="text-muted-foreground block">Reconciliation Delta:</span>
                <span
                  className={`font-bold text-sm ${
                    delta > 0
                      ? "text-emerald-600"
                      : delta < 0
                      ? "text-rose-600"
                      : "text-muted-foreground"
                  }`}
                >
                  {delta > 0 ? `+${delta}` : delta}
                </span>
              </div>
            </div>

            <FormInput
              name="newQuantity"
              label="New Physical Count (Quantity)"
              type="number"
              placeholder="Enter verified physical count..."
              required
            />

            <FormTextarea
              name="notes"
              label="Mandatory Audit Reason"
              placeholder="Reason for discrepancy (e.g., Annual physical inventory count discrepancy, broken packaging, miscount correction)..."
              required
            />

            {/* Photo / Audit Sheet Upload */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">
                Audit Sheet / Physical Count Evidence (Optional)
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

            <DialogFooter className="pt-4">
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
              >
                {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                Confirm Audit Adjustment
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
