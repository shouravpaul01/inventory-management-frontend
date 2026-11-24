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
import { FormFileUpload } from "@/components/shared/form/FormFileUpload";
import { useAdjustStockMutation } from "@/redux/api/stockApi";
import { useGetItemsQuery } from "@/redux/api/itemApi";
import { useGetStockLocationsQuery } from "@/redux/api/locationApi";
import { stockAdjustSchema, TStockAdjustInput } from "@/validation/stock.validation";
import { toast } from "sonner";
import { Loader2, SlidersHorizontal } from "lucide-react";
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
  const { data: itemsData } = useGetItemsQuery({ limit: 100 });
  const items = itemsData?.data || [];

  const { data: locationsData } = useGetStockLocationsQuery({ limit: 100 });
  const locations = locationsData?.data || [];

  const [adjustStock, { isLoading }] = useAdjustStockMutation();

  const itemOptions = items.map((item) => ({
    value: item.id,
    label: `${item.name} (${item.code})${item.isReturnable ? " [Returnable]" : ""}${item.trackingType === "SERIALIZED" ? " [Serialized]" : ""}`,
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
      newQuantity: balance?.quantity ?? 0,
      notes: "",
      photo: null,
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
        photo: null,
      });
    }
  }, [balance?.id, open, reset]);

  const currentQty = balance?.quantity ?? 0;
  const delta = (Number(newQty) || 0) - currentQty;

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
      if (values.photo && values.photo instanceof File) {
        formData.append("photo", values.photo);
      }

      const res = await adjustStock(formData).unwrap();
      handleMutationResult(res, "Stock balance adjusted and audit record logged.");
      reset();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to adjust stock balance");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl! max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-5 pb-3 border-b bg-card shrink-0">
          <DialogTitle className="flex items-center gap-2 text-primary">
            <SlidersHorizontal className="size-5" />
            Stock Adjustment & Reconciliation
          </DialogTitle>
          <DialogDescription className="text-xs">
            Audit count discrepancy adjustment. Modifying stock creates a permanent audit movement log.
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

              {/* Photo / Audit Sheet Upload via FormFileUpload */}
              <FormFileUpload
                name="photo"
                label="Audit Sheet / Physical Count Evidence (Optional)"
                description="Upload audit reconciliation sheet, discrepancy report, or photo evidence"
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
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="cursor-pointer"
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

