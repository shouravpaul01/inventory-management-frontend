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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  useCreateItemMutation,
  useUpdateItemMutation,
} from "@/redux/api/itemApi";
import { useGetCategoriesQuery } from "@/redux/api/categoryApi";
import { itemFormSchema, TItemFormInput } from "@/validation/item.validation";
import { toast } from "sonner";
import { Loader2, Package } from "lucide-react";
import { TInventoryItem } from "@/type";
import { handleMutationResult } from "@/lib/notifyMutation";

interface ItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: TInventoryItem | null;
}

export default function ItemModal({
  open,
  onOpenChange,
  item,
}: ItemModalProps) {
  const isEdit = Boolean(item);

  const { data: categoriesData } = useGetCategoriesQuery({ limit: 100 });
  const [createItem, { isLoading: isCreating }] = useCreateItemMutation();
  const [updateItem, { isLoading: isUpdating }] = useUpdateItemMutation();
  const isLoading = isCreating || isUpdating;

  const categoryOptions = (categoriesData?.data || []).map((cat) => ({
    value: cat.id,
    label: `${cat.name} (${cat.code})`,
  }));

  const trackingTypeOptions = [
    { value: "SERIALIZED", label: "Serialized Asset (Tracked with individual barcodes/units)" },
    { value: "BULK", label: "Bulk Consumable (Tracked by total quantity / balances)" },
  ];

  const issuePolicyOptions = [
    { value: "PERMANENT", label: "Permanent Allocation (Not expected back)" },
    { value: "TEMPORARY", label: "Temporary Loan (Returnable / Equipment check-out)" },
    { value: "GIFT", label: "Official Gift / Honorarium" },
  ];

  const unitMeasureOptions = [
    { value: "Piece", label: "Piece / Each (PCS)" },
    { value: "Box", label: "Box (BOX)" },
    { value: "Pack", label: "Pack (PACK)" },
    { value: "Kg", label: "Kilogram (KG)" },
    { value: "Liter", label: "Liter (L)" },
    { value: "Meter", label: "Meter (M)" },
    { value: "Roll", label: "Roll (ROLL)" },
    { value: "Set", label: "Set / Kit (SET)" },
  ];

  const methods = useForm<TItemFormInput>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      name: "",
      code: "",
      sku: "",
      categoryId: "",
      brand: "",
      model: "",
      trackingType: "SERIALIZED",
      isReturnable: false,
      defaultIssuePolicy: "PERMANENT",
      unitName: "Piece",
      minimumStock: 5,
      reorderLevel: 10,
      description: "",
    },
  });

  const { watch, setValue, reset } = methods;
  const isReturnable = watch("isReturnable");

  useEffect(() => {
    if (!open) return;

    if (item) {
      reset({
        name: item.name,
        code: item.code,
        sku: item.sku || "",
        categoryId: item.categoryId,
        brand: item.brand || "",
        model: item.model || "",
        trackingType: item.trackingType,
        isReturnable: Boolean(item.isReturnable),
        defaultIssuePolicy: item.defaultIssuePolicy,
        unitName: item.unitName || "Piece",
        minimumStock: item.minimumStock || 0,
        reorderLevel: item.reorderLevel || 0,
        description: item.description || "",
      });
    } else {
      reset({
        name: "",
        code: "",
        sku: "",
        categoryId: "",
        brand: "",
        model: "",
        trackingType: "SERIALIZED",
        isReturnable: false,
        defaultIssuePolicy: "PERMANENT",
        unitName: "Piece",
        minimumStock: 5,
        reorderLevel: 10,
        description: "",
      });
    }
  }, [item?.id, open, reset]);

  const onSubmit = async (data: TItemFormInput) => {
    try {
      if (isEdit && item) {
        const res = await updateItem({
          id: item.id,
          body: {
            name: data.name.trim(),
            sku: data.sku?.trim() || undefined,
            categoryId: data.categoryId,
            brand: data.brand?.trim() || undefined,
            model: data.model?.trim() || undefined,
            trackingType: data.trackingType,
            isReturnable: data.isReturnable,
            defaultIssuePolicy: data.defaultIssuePolicy,
            unitName: data.unitName,
            minimumStock: data.minimumStock,
            reorderLevel: data.reorderLevel,
            description: data.description?.trim(),
          },
        }).unwrap();

        handleMutationResult(res, "Inventory item updated successfully 🎉");
      } else {
        const res = await createItem({
          name: data.name.trim(),
          code: data.code?.trim() || undefined,
          sku: data.sku?.trim() || undefined,
          categoryId: data.categoryId,
          brand: data.brand?.trim() || undefined,
          model: data.model?.trim() || undefined,
          trackingType: data.trackingType,
          isReturnable: data.isReturnable,
          defaultIssuePolicy: data.defaultIssuePolicy,
          unitName: data.unitName,
          minimumStock: data.minimumStock,
          reorderLevel: data.reorderLevel,
          description: data.description?.trim(),
        }).unwrap();

        handleMutationResult(res, "Inventory item cataloged successfully 🎉");
      }
      onOpenChange(false);
      methods.reset();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to save item");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="size-5 text-primary" />
            {isEdit ? "Edit Inventory Item" : "Catalog New Inventory Item"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update item details, replenishment thresholds, and issuance policies."
              : "Register a consumable or asset item into the institutional inventory catalog."}
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormInput
                name="name"
                label="Item Name"
                placeholder="e.g. Dell UltraSharp 27 Monitor, A4 Paper Ream"
                disabled={isLoading}
              />
              <FormInput
                name="code"
                label="Item Code (Optional - Auto-generated if blank)"
                placeholder="e.g. MON-DELL-27"
                disabled={isLoading || isEdit}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormSelect
                name="categoryId"
                label="Category"
                placeholder="Select Category"
                options={categoryOptions}
                disabled={isLoading}
              />

              <FormInput
                name="sku"
                label="SKU / Manufacturer Part No. (Optional)"
                placeholder="e.g. U2723QE-01"
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormInput
                name="brand"
                label="Brand / Manufacturer (Optional)"
                placeholder="e.g. Dell, HP, Epson"
                disabled={isLoading}
              />

              <FormInput
                name="model"
                label="Model / Specification (Optional)"
                placeholder="e.g. 2024 Edition, Core i7"
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormSelect
                name="trackingType"
                label="Tracking Strategy"
                options={trackingTypeOptions}
                disabled={isLoading || isEdit}
              />

              <FormSelect
                name="defaultIssuePolicy"
                label="Default Issue Policy"
                options={issuePolicyOptions}
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormSelect
                name="unitName"
                label="Unit of Measure"
                options={unitMeasureOptions}
                disabled={isLoading}
              />

              <FormInput
                name="minimumStock"
                label="Safety / Min Stock"
                type="number"
                placeholder="e.g. 5"
                disabled={isLoading}
              />

              <FormInput
                name="reorderLevel"
                label="Reorder Alert Level"
                type="number"
                placeholder="e.g. 10"
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center space-x-2 py-1">
              <Checkbox
                id="isReturnable"
                checked={isReturnable}
                onCheckedChange={(checked) => setValue("isReturnable", Boolean(checked))}
              />
              <Label htmlFor="isReturnable" className="text-xs font-medium cursor-pointer">
                Must be returned to department after loan/use (Check-out asset)
              </Label>
            </div>

            <FormTextarea
              name="description"
              label="Item Notes / Description (Optional)"
              placeholder="Storage requirements, standard packaging, or warranty details"
              disabled={isLoading}
              rows={2}
            />

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Saving...
                  </>
                ) : isEdit ? (
                  "Save Changes"
                ) : (
                  "Catalog Item"
                )}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
