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
import { useStockOutMutation } from "@/redux/api/stockApi";
import { useGetItemsQuery } from "@/redux/api/itemApi";
import { useGetStockLocationsQuery } from "@/redux/api/locationApi";
import { stockOutSchema, TStockOutInput } from "@/validation/stock.validation";
import { toast } from "sonner";
import { Loader2, MinusCircle, Upload } from "lucide-react";
import { TStockBalance } from "@/type";

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
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const { data: itemsData } = useGetItemsQuery({ limit: 100 });
  const items = itemsData?.data || [];

  const { data: locationsData } = useGetStockLocationsQuery({ limit: 100 });
  const locations = locationsData?.data || [];

  const [stockOut, { isLoading }] = useStockOutMutation();

  const itemOptions = items.map((item) => ({
    value: item.id,
    label: `${item.name} (${item.code})`,
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
    },
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (values: TStockOutInput) => {
    try {
      const formData = new FormData();
      formData.append(
        "data",
        JSON.stringify({
          inventoryItemId: values.inventoryItemId,
          locationId: values.locationId,
          quantity: Number(values.quantity),
          type: values.type,
          notes: values.notes || undefined,
        })
      );
      if (selectedPhoto) {
        formData.append("photo", selectedPhoto);
      }

      await stockOut(formData).unwrap();
      toast.success("Stock deducted and movement recorded successfully.");
      methods.reset();
      setSelectedPhoto(null);
      setPhotoPreview(null);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to process stock deduction");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-5 pb-3 border-b bg-card shrink-0">
          <DialogTitle className="flex items-center gap-2 text-rose-600">
            <MinusCircle className="size-5" />
            Stock Out (Deduction / Disposal)
          </DialogTitle>
          <DialogDescription className="text-xs">
            Record inventory write-offs, damaged stock disposal, or consumption.
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

            <FormInput
              name="quantity"
              label="Quantity to Deduct"
              type="number"
              placeholder="e.g. 5"
              required
            />

            <FormTextarea
              name="notes"
              label="Justification / Inspection Notes"
              placeholder="Reason for write-off, incident report #, or disposal committee approval..."
            />

            {/* Photo Upload */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">
                Attachment (Damage / Disposal Evidence)
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
                disabled={isLoading}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                Confirm Stock Out
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
