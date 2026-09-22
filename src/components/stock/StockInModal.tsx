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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStockInMutation } from "@/redux/api/stockApi";
import { useGetItemsQuery } from "@/redux/api/itemApi";
import { useGetStockLocationsQuery } from "@/redux/api/locationApi";
import { stockInSchema, TStockInInput, TUnitIntakeItem } from "@/validation/stock.validation";
import { toast } from "sonner";
import { Loader2, PlusCircle, Upload, ShieldCheck, Sparkles, Hash } from "lucide-react";
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
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [autoGenerateCodes, setAutoGenerateCodes] = useState(true);
  const [unitRows, setUnitRows] = useState<TUnitIntakeItem[]>([]);

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

  const watchItemId = methods.watch("inventoryItemId");
  const watchQty = methods.watch("quantity") || 1;

  const selectedItem = items.find((i) => i.id === watchItemId);
  const isSerialized = selectedItem?.trackingType === "SERIALIZED" || Boolean(selectedItem?.isReturnable);

  // Sync unit rows with quantity count when serialized
  useEffect(() => {
    if (!isSerialized) {
      setUnitRows([]);
      return;
    }
    const targetCount = Math.max(1, Math.min(Number(watchQty) || 1, 100));
    setUnitRows((prev) => {
      if (prev.length === targetCount) return prev;
      if (prev.length < targetCount) {
        const next = [...prev];
        for (let i = prev.length; i < targetCount; i++) {
          next.push({
            uniqueCode: "",
            serialNumber: "",
            condition: "NEW",
            notes: "",
          });
        }
        return next;
      }
      return prev.slice(0, targetCount);
    });
  }, [isSerialized, watchQty]);

  const handleUnitChange = (index: number, field: keyof TUnitIntakeItem, val: string) => {
    setUnitRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

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
        payloadData.autoGenerateCodes = autoGenerateCodes;
        payloadData.units = unitRows.map((u) => ({
          uniqueCode: u.uniqueCode?.trim() || undefined,
          serialNumber: u.serialNumber?.trim() || undefined,
          condition: u.condition || "NEW",
          notes: u.notes?.trim() || undefined,
        }));
      }

      const formData = new FormData();
      formData.append("data", JSON.stringify(payloadData));
      if (selectedPhoto) {
        formData.append("photo", selectedPhoto);
      }

      const res = await stockIn(formData).unwrap();
      handleMutationResult(res, "Stock received and individual asset units registered successfully.");
      methods.reset();
      setSelectedPhoto(null);
      setPhotoPreview(null);
      setUnitRows([]);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to process stock intake");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-5 pb-3 border-b bg-card shrink-0">
          <DialogTitle className="flex items-center gap-2 text-emerald-600">
            <PlusCircle className="size-5" />
            Stock In (Intake / Purchase)
          </DialogTitle>
          <DialogDescription className="text-xs">
            Record newly received goods, purchase deliveries, and register physical asset units.
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
                <div className="border rounded-lg p-3 bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between gap-2 border-b pb-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      <ShieldCheck className="size-4" />
                      <span>Returnable Asset Unit Registration ({unitRows.length} {unitRows.length === 1 ? "unit" : "units"})</span>
                    </div>

                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                      <Checkbox
                        checked={autoGenerateCodes}
                        onCheckedChange={(checked) => setAutoGenerateCodes(Boolean(checked))}
                        className="size-3.5"
                      />
                      <Sparkles className="size-3 text-amber-500" />
                      <span>Auto-generate Asset Codes</span>
                    </label>
                  </div>

                  <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                    {unitRows.map((row, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 rounded-md border bg-card text-xs items-center"
                      >
                        <div className="sm:col-span-1 text-center font-mono font-bold text-muted-foreground">
                          #{idx + 1}
                        </div>

                        <div className="sm:col-span-4">
                          <label className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 mb-0.5">
                            <Hash className="size-2.5" />
                            Asset Tag / Code
                          </label>
                          {autoGenerateCodes ? (
                            <div className="h-8 px-2 rounded-md border bg-muted/40 text-muted-foreground flex items-center text-[11px] font-mono">
                              (Auto-generated)
                            </div>
                          ) : (
                            <Input
                              placeholder="e.g. LAP-00101"
                              value={row.uniqueCode || ""}
                              onChange={(e) => handleUnitChange(idx, "uniqueCode", e.target.value)}
                              className="h-8 text-xs font-mono bg-background"
                            />
                          )}
                        </div>

                        <div className="sm:col-span-4">
                          <label className="text-[10px] text-muted-foreground font-medium mb-0.5 block">
                            Hardware Serial #
                          </label>
                          <Input
                            placeholder="e.g. SN-998822"
                            value={row.serialNumber || ""}
                            onChange={(e) => handleUnitChange(idx, "serialNumber", e.target.value)}
                            className="h-8 text-xs font-mono bg-background"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="text-[10px] text-muted-foreground font-medium mb-0.5 block">
                            Condition
                          </label>
                          <Select
                            value={row.condition || "NEW"}
                            onValueChange={(val) => handleUnitChange(idx, "condition", val)}
                          >
                            <SelectTrigger className="h-8 text-xs bg-background">
                              <SelectValue placeholder="Condition" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="NEW">Brand New</SelectItem>
                              <SelectItem value="GOOD">Good Working</SelectItem>
                              <SelectItem value="FAIR">Fair / Used</SelectItem>
                              <SelectItem value="DAMAGED">Defect / Damaged</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] text-muted-foreground italic">
                    Each physical unit will be uniquely registered in storage and available for requisition distribution and return tracking.
                  </p>
                </div>
              )}

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

