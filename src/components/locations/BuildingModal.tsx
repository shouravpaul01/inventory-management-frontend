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
import {
  useCreateBuildingMutation,
  useUpdateBuildingMutation,
} from "@/redux/api/locationApi";
import {
  createBuildingSchema,
  TCreateBuildingInput,
} from "@/validation/location.validation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { TBuilding } from "@/type";

interface BuildingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  building?: TBuilding | null;
}

export default function BuildingModal({
  open,
  onOpenChange,
  building,
}: BuildingModalProps) {
  const isEdit = Boolean(building);

  const [createBuilding, { isLoading: isCreating }] =
    useCreateBuildingMutation();
  const [updateBuilding, { isLoading: isUpdating }] =
    useUpdateBuildingMutation();
  const isLoading = isCreating || isUpdating;

  const methods = useForm<TCreateBuildingInput>({
    resolver: zodResolver(createBuildingSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      address: "",
    },
  });

  useEffect(() => {
    if (building) {
      methods.reset({
        name: building.name,
        code: building.code,
        description: building.description || "",
        address: building.address || "",
      });
    } else {
      methods.reset({
        name: "",
        code: "",
        description: "",
        address: "",
      });
    }
  }, [building, open, methods]);

  const onSubmit = async (data: TCreateBuildingInput) => {
    try {
      if (isEdit && building) {
        await updateBuilding({
          id: building.id,
          body: {
            name: data.name.trim(),
            description: data.description?.trim(),
            address: data.address?.trim(),
          },
        }).unwrap();
        toast.success("Building updated successfully 🎉");
      } else {
        await createBuilding({
          name: data.name.trim(),
          code: data.code.trim().toUpperCase(),
          description: data.description?.trim(),
          address: data.address?.trim(),
        }).unwrap();
        toast.success("Building registered successfully 🎉");
      }
      onOpenChange(false);
      methods.reset();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to save building");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Campus Building" : "Register Campus Building"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update building details and campus address."
              : "Add a campus facility or academic building to the inventory system."}
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
            <FormInput
              name="name"
              label="Building Name"
              placeholder="e.g. Science & Technology Complex"
              disabled={isLoading}
              required
            />

            <FormInput
              name="code"
              label="Building Code"
              placeholder="e.g. BLD-STC"
              disabled={isLoading || isEdit}
              required
            />

            <FormInput
              name="address"
              label="Campus Location / Address"
              placeholder="e.g. North Campus, Academic Block 2"
              disabled={isLoading}
            />

            <FormTextarea
              name="description"
              label="Description (Optional)"
              placeholder="Facility details or operational notes"
              disabled={isLoading}
              rows={3}
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
                  "Register Building"
                )}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
