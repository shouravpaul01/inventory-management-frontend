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
import { useTransferStockMutation } from "@/redux/api/stockApi";
import { useGetItemsQuery } from "@/redux/api/itemApi";
import { useGetStockLocationsQuery } from "@/redux/api/locationApi";
import { stockTransferSchema, TStockTransferInput } from "@/validation/stock.validation";
import { toast } from "sonner";
import { Loader2, ArrowRightLeft, Upload } from "lucide-react";
import { TStockBalance } from "@/type";

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

  const { data: itemsData } = useGetItemsQuery({ limit: 100 });
  const items = itemsData?.data || [];

  const { data: locationsData } = useGetStockLocationsQuery({ limit: 100 });
  const locations = locationsData?.data || [];

  const [transferStock, { isLoading }] = useTransferStockMutation();

  const itemOptions = items.map((item) => ({
    value: item.id,
    label: `${item.name} (${item.code})`,
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

    try {
      const formData = new FormData();
      formData.append(
        "data",
        JSON.stringify({
          inventoryItemId: values.inventoryItemId,
          fromLocationId: values.fromLocationId,
          toLocationId: values.toLocationId,
          quantity: Number(values.quantity),
          notes: values.notes || undefined,
        })
      );
      if (selectedPhoto) {
        formData.append("photo", selectedPhoto);
      }

      await transferStock(formData).unwrap();
      toast.success("Stock transferred successfully between locations.");
      methods.reset();
      setSelectedPhoto(null);
      setPhotoPreview(null);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to transfer stock");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-600">
            <ArrowRightLeft className="size-5" />
            Internal Stock Transfer
          </DialogTitle>
          <DialogDescription>
            Relocate stock or serialized assets between warehouses, rooms, and department stores.
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4 py-2">
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

            <FormInput
              name="quantity"
              label="Transfer Quantity"
              type="number"
              placeholder="e.g. 10"
              required
            />

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
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                Confirm Transfer
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
