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
import { useStockInMutation } from "@/redux/api/stockApi";
import { useGetItemsQuery } from "@/redux/api/itemApi";
import { useGetStockLocationsQuery } from "@/redux/api/locationApi";
import { stockInSchema, TStockInInput } from "@/validation/stock.validation";
import { toast } from "sonner";
import { Loader2, PlusCircle, Upload, Image as ImageIcon } from "lucide-react";
import { TStockBalance } from "@/type";

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
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const { data: itemsData } = useGetItemsQuery({ limit: 100 });
  const items = itemsData?.data || [];

  const { data: locationsData } = useGetStockLocationsQuery({ limit: 100 });
  const locations = locationsData?.data || [];

  const [stockIn, { isLoading }] = useStockInMutation();

  const itemOptions = items.map((item) => ({
    value: item.id,
    label: `${item.name} (${item.code})`,
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

  const methods = useForm<TStockInInput>({
    resolver: zodResolver(stockInSchema),
    defaultValues: {
      inventoryItemId: defaultBalance?.inventoryItemId || "",
      locationId: defaultBalance?.locationId || "",
      quantity: 1,
      type: "STOCK_IN",
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

  const onSubmit = async (values: TStockInInput) => {
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

      await stockIn(formData).unwrap();
      toast.success("Stock received and balance updated successfully.");
      methods.reset();
      setSelectedPhoto(null);
      setPhotoPreview(null);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to process stock intake");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-600">
            <PlusCircle className="size-5" />
            Stock In (Intake / Purchase)
          </DialogTitle>
          <DialogDescription>
            Record newly received goods, purchase deliveries, or baseline inventory.
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
              label="Quantity"
              type="number"
              placeholder="e.g. 25"
              required
            />

            <FormTextarea
              name="notes"
              label="Delivery / Invoice Notes (Optional)"
              placeholder="Purchase Order #, delivery challan reference, or supplier remarks..."
            />

            {/* Photo / Invoice Upload */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">
                Attachment (Delivery Note / Invoice Photo)
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
