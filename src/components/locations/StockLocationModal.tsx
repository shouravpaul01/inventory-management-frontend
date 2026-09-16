"use client";

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
import {
  useCreateStockLocationMutation,
  useGetBuildingsQuery,
  useGetRoomsQuery,
} from "@/redux/api/locationApi";
import {
  createStockLocationSchema,
  TCreateStockLocationInput,
} from "@/validation/location.validation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface StockLocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function StockLocationModal({
  open,
  onOpenChange,
}: StockLocationModalProps) {
  const { data: buildingsData } = useGetBuildingsQuery();
  const { data: roomsData } = useGetRoomsQuery({ limit: 100 });
  const [createStockLocation, { isLoading }] = useCreateStockLocationMutation();

  const buildingOptions = (buildingsData?.data || []).map((b) => ({
    value: b.id,
    label: `${b.name} (${b.code})`,
  }));

  const roomOptions = (roomsData?.data || []).map((r) => ({
    value: r.id,
    label: `${r.name} (${r.code})`,
  }));

  const typeOptions = [
    { value: "STORE", label: "Central or Department Store" },
    { value: "ROOM", label: "Dedicated Room / Storage Area" },
    { value: "RACK", label: "Storage Rack" },
    { value: "SHELF", label: "Numbered Shelf" },
    { value: "CABINET", label: "Secure Cabinet / Cupboard" },
    { value: "OTHER", label: "Other Container / Bin" },
  ];

  const methods = useForm<TCreateStockLocationInput>({
    resolver: zodResolver(createStockLocationSchema),
    defaultValues: {
      name: "",
      code: "",
      type: "SHELF",
      description: "",
      buildingId: "",
      roomId: "",
    },
  });

  const onSubmit = async (data: TCreateStockLocationInput) => {
    try {
      await createStockLocation({
        name: data.name.trim(),
        code: data.code.trim().toUpperCase(),
        type: data.type,
        description: data.description?.trim(),
        buildingId: data.buildingId || undefined,
        roomId: data.roomId || undefined,
      }).unwrap();

      toast.success("Storage Location registered successfully 🎉");
      onOpenChange(false);
      methods.reset();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to create storage location");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-5 pb-3 border-b bg-card shrink-0">
          <DialogTitle>Add Stock Storage Unit / Shelf</DialogTitle>
          <DialogDescription>
            Define an exact physical shelf, cabinet, or bin where inventory units and
            stock are placed.
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <FormInput
                name="name"
                label="Location / Shelf Name"
                placeholder="e.g. Component Rack 3, Optics Cabinet A"
                disabled={isLoading}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormInput
                  name="code"
                  label="Location Code"
                  placeholder="e.g. RCK-03, CAB-A"
                  disabled={isLoading}
                  required
                />

                <FormSelect
                  name="type"
                  label="Storage Type"
                  options={typeOptions}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormSelect
                  name="buildingId"
                  label="Building (Optional)"
                  placeholder="Select Building"
                  options={[{ value: "", label: "None" }, ...buildingOptions]}
                  disabled={isLoading}
                />

                <FormSelect
                  name="roomId"
                  label="Room / Lab (Optional)"
                  placeholder="Select Room"
                  options={[{ value: "", label: "None" }, ...roomOptions]}
                  disabled={isLoading}
                />
              </div>

              <FormTextarea
                name="description"
                label="Description (Optional)"
                placeholder="Shelf level, access key required, or storage instructions"
                disabled={isLoading}
                rows={2}
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
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Create Storage Location"
                )}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
