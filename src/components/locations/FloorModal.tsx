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
import { FormSelect } from "@/components/shared/form/FormSelect";
import {
  useCreateFloorMutation,
  useUpdateFloorMutation,
  useGetBuildingsQuery,
} from "@/redux/api/locationApi";
import {
  createFloorSchema,
  TCreateFloorInput,
} from "@/validation/location.validation";
import { toast } from "sonner";
import { Loader2, Layers } from "lucide-react";
import { TFloor } from "@/type";

interface FloorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  floor?: TFloor | null;
  defaultBuildingId?: string;
}

export default function FloorModal({
  open,
  onOpenChange,
  floor,
  defaultBuildingId,
}: FloorModalProps) {
  const isEdit = Boolean(floor);

  const { data: buildingsData } = useGetBuildingsQuery();
  const buildings = buildingsData?.data || [];

  const buildingOptions = buildings.map((b) => ({
    value: b.id,
    label: `${b.name} (${b.code})`,
  }));

  const [createFloor, { isLoading: isCreating }] = useCreateFloorMutation();
  const [updateFloor, { isLoading: isUpdating }] = useUpdateFloorMutation();
  const isLoading = isCreating || isUpdating;

  const methods = useForm<TCreateFloorInput>({
    resolver: zodResolver(createFloorSchema),
    defaultValues: {
      buildingId: defaultBuildingId || "",
      name: "",
      code: "",
      floorNumber: 1,
    },
  });

  const { reset } = methods;

  useEffect(() => {
    if (!open) return;

    if (floor) {
      reset({
        buildingId: floor.buildingId || defaultBuildingId || "",
        name: floor.name,
        code: floor.code,
        floorNumber: floor.floorNumber ?? 1,
      });
    } else {
      reset({
        buildingId: defaultBuildingId || "",
        name: "",
        code: "",
        floorNumber: 1,
      });
    }
  }, [floor, defaultBuildingId, open, reset]);

  const onSubmit = async (data: TCreateFloorInput) => {
    try {
      if (isEdit && floor) {
        await updateFloor({
          id: floor.id,
          body: {
            buildingId: data.buildingId,
            name: data.name.trim(),
            code: data.code.trim().toUpperCase(),
            floorNumber:
              data.floorNumber !== undefined && data.floorNumber !== null
                ? Number(data.floorNumber)
                : undefined,
          },
        }).unwrap();
        toast.success("Floor level updated successfully 🎉");
      } else {
        await createFloor({
          buildingId: data.buildingId,
          name: data.name.trim(),
          code: data.code.trim().toUpperCase(),
          floorNumber:
            data.floorNumber !== undefined && data.floorNumber !== null
              ? Number(data.floorNumber)
              : undefined,
        }).unwrap();
        toast.success("Floor level registered successfully 🎉");
      }

      onOpenChange(false);
      methods.reset();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to save floor record");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-5 pb-3 border-b bg-card shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Layers className="size-5 text-primary" />
            {isEdit ? "Edit Floor Level" : "Register Floor Level"}
          </DialogTitle>
          <DialogDescription>
            Configure building floors to organize departmental rooms, laboratories, and storage.
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 min-h-0 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <FormSelect
                name="buildingId"
                label="Building"
                placeholder="Select parent building"
                options={buildingOptions}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput
                  name="name"
                  label="Floor Name"
                  placeholder="e.g. 1st Floor, Ground Floor"
                  required
                />

                <FormInput
                  name="code"
                  label="Floor Code"
                  placeholder="e.g. 1F, GF, L2"
                  required
                />
              </div>

              <FormInput
                name="floorNumber"
                label="Floor Number / Level"
                type="number"
                placeholder="e.g. 1 (Ground = 0, Basement = -1)"
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
                {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                {isEdit ? "Update Floor" : "Create Floor"}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
