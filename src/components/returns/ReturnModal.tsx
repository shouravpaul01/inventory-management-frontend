"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
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
import { useProcessReturnMutation } from "@/redux/api/returnApi";
import { useGetDistributionsQuery } from "@/redux/api/distributionApi";
import { useGetStockLocationsQuery } from "@/redux/api/locationApi";
import { useGetItemsQuery } from "@/redux/api/itemApi";
import { useGetUnitsQuery } from "@/redux/api/unitApi";
import {
  processReturnSchema,
  TProcessReturnInput,
} from "@/validation/return.validation";
import { toast } from "sonner";
import {
  Loader2,
  RotateCcw,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
} from "lucide-react";

interface ReturnModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDistributionId?: string;
}

export default function ReturnModal({
  open,
  onOpenChange,
  defaultDistributionId,
}: ReturnModalProps) {
  const [processReturn, { isLoading }] = useProcessReturnMutation();
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const { data: distributionsData } = useGetDistributionsQuery({ limit: 50 });
  const distributions = distributionsData?.data || [];

  const { data: locationsData } = useGetStockLocationsQuery({ limit: 50 });
  const locations = locationsData?.data || [];

  const { data: itemsData } = useGetItemsQuery({ limit: 100 });
  const items = itemsData?.data || [];

  const { data: unitsData } = useGetUnitsQuery({ limit: 100 });
  const units = unitsData?.data || [];

  const distOptions = distributions.map((d) => ({
    value: d.id,
    label: `${d.distributionNo} - Recipient: ${
      d.receiver ? `${d.receiver.firstName} ${d.receiver.lastName}` : "Receiver"
    }`,
  }));

  const locationOptions = locations.map((loc) => ({
    value: loc.id,
    label: `${loc.name} (${loc.code})`,
  }));

  const itemOptions = items.map((i) => ({
    value: i.id,
    label: `${i.name} (${i.code})`,
  }));

  const unitOptions = units.map((u) => ({
    value: u.id,
    label: `${u.uniqueCode} - ${u.inventoryItem?.name || "Unit"}`,
  }));

  const conditionOptions = [
    { value: "GOOD", label: "Good (Fully functional & clean)" },
    { value: "SAME", label: "Same As Issued (Unchanged condition)" },
    { value: "NEEDS_REPAIR", label: "Needs Repair / Service" },
    { value: "DAMAGED", label: "Damaged / Broken" },
    { value: "LOST", label: "Lost / Not Returned" },
  ];

  const methods = useForm<TProcessReturnInput>({
    resolver: zodResolver(processReturnSchema),
    defaultValues: {
      distributionId: defaultDistributionId || "",
      status: "RETURNED",
      remarks: "",
      lines: [
        {
          inventoryItemId: "",
          inventoryUnitId: "",
          destinationLocationId: "",
          quantity: 1,
          condition: "GOOD",
          remarks: "",
        },
      ],
    },
  });

  const { control, watch, setValue, handleSubmit, reset } = methods;
  const selectedDistId = watch("distributionId");

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lines",
  });

  // When distribution is picked, prefill items from distribution lines
  useEffect(() => {
    if (!open) return;
    if (selectedDistId) {
      const foundDist = distributions.find((d) => d.id === selectedDistId);
      if (foundDist) {
        const distLines = foundDist.lines || foundDist.items || [];
        if (distLines.length > 0) {
          const mappedLines = distLines.map((dl) => ({
            inventoryItemId: dl.inventoryItemId,
            inventoryUnitId: dl.inventoryUnitId || "",
            destinationLocationId: dl.locationId || locations[0]?.id || "",
            quantity: dl.quantity,
            condition: "GOOD" as const,
            remarks: "",
          }));
          setValue("lines", mappedLines);
        }
      }
    }
  }, [selectedDistId, distributions, setValue, locations, open]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (values: TProcessReturnInput) => {
    try {
      const formData = new FormData();
      formData.append(
        "data",
        JSON.stringify({
          distributionId: values.distributionId,
          status: values.status,
          remarks: values.remarks || undefined,
          lines: values.lines.map((l) => ({
            inventoryItemId: l.inventoryItemId,
            inventoryUnitId: l.inventoryUnitId || undefined,
            destinationLocationId: l.destinationLocationId,
            quantity: Number(l.quantity),
            condition: l.condition,
            remarks: l.remarks || undefined,
          })),
        })
      );
      if (selectedPhoto) {
        formData.append("photo", selectedPhoto);
      }

      await processReturn(formData).unwrap();
      toast.success("Return processed and stock restocked successfully.");
      reset();
      setSelectedPhoto(null);
      setPhotoPreview(null);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to process return");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <RotateCcw className="size-5" />
            Process Material Return & Restocking
          </DialogTitle>
          <DialogDescription>
            Return loaned equipment, damaged goods, or surplus supplies back into inventory.
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormSelect
                name="distributionId"
                label="Original Distribution Reference"
                placeholder="Select distribution"
                options={distOptions}
                required
              />

              <FormSelect
                name="status"
                label="Return Status"
                options={[
                  { value: "RETURNED", label: "Fully Returned & Restocked" },
                  { value: "PARTIALLY_RETURNED", label: "Partially Returned" },
                  { value: "OVERDUE", label: "Overdue Loan Return" },
                  { value: "LOST", label: "Declared Lost" },
                ]}
                required
              />
            </div>

            {/* Return Items Repeater */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Returned Items ({fields.length})
                </h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      inventoryItemId: "",
                      inventoryUnitId: "",
                      destinationLocationId: locations[0]?.id || "",
                      quantity: 1,
                      condition: "GOOD",
                      remarks: "",
                    })
                  }
                  className="gap-1.5 text-xs h-7"
                >
                  <Plus className="size-3.5" />
                  Add Return Item
                </Button>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="p-3.5 rounded-lg border bg-card relative space-y-3 shadow-2xs"
                  >
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-xs font-bold text-muted-foreground">
                        Item #{index + 1}
                      </span>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => remove(index)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-6">
                        <FormSelect
                          name={`lines.${index}.inventoryItemId`}
                          label="Inventory Item"
                          placeholder="Select an item"
                          options={itemOptions}
                          required
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <FormSelect
                          name={`lines.${index}.destinationLocationId`}
                          label="Restock Destination Location"
                          placeholder="Target location"
                          options={locationOptions}
                          required
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <FormInput
                          name={`lines.${index}.quantity`}
                          label="Qty"
                          type="number"
                          placeholder="Qty"
                          required
                        />
                      </div>
                    </div>

                    {/* Serialized Unit & Return Condition */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormSelect
                        name={`lines.${index}.inventoryUnitId`}
                        label="Specific Asset Tag (If Serialized)"
                        placeholder="Optional physical unit"
                        options={unitOptions}
                      />

                      <FormSelect
                        name={`lines.${index}.condition`}
                        label="Assessed Condition"
                        options={conditionOptions}
                        required
                      />
                    </div>

                    <FormInput
                      name={`lines.${index}.remarks`}
                      label="Inspection Remarks (Optional)"
                      placeholder="e.g. Scratches on front panel, missing charger cable..."
                    />
                  </div>
                ))}
              </div>
            </div>

            <FormTextarea
              name="remarks"
              label="Overall Return Assessment Remarks"
              placeholder="Storekeeper inspection summary, restocking notes..."
            />

            {/* Photo / Condition Proof Upload */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">
                Inspection Attachment (Photo of returned items or condition evidence)
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-3 py-2 border rounded-md border-dashed cursor-pointer hover:bg-muted/50 text-xs text-muted-foreground transition-colors">
                  <Upload className="size-4" />
                  <span>{selectedPhoto ? selectedPhoto.name : "Upload inspection image"}</span>
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
                Confirm Restocking & Return
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
