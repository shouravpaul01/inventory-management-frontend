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
import FilterSelect from "@/components/shared/FilterSelect";
import {
  useCreateRoomMutation,
  useGetBuildingsQuery,
  useGetFloorsQuery,
  useGetRoomTypesQuery,
} from "@/redux/api/locationApi";
import {
  createRoomSchema,
  TCreateRoomInput,
} from "@/validation/location.validation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface RoomModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function RoomModal({ open, onOpenChange }: RoomModalProps) {
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>("");

  const { data: buildingsData } = useGetBuildingsQuery();
  const { data: floorsData } = useGetFloorsQuery(
    selectedBuildingId ? { buildingId: selectedBuildingId } : undefined
  );
  const { data: roomTypesData } = useGetRoomTypesQuery();

  const [createRoom, { isLoading }] = useCreateRoomMutation();

  const buildingOptions = (buildingsData?.data || []).map((b) => ({
    value: b.id,
    label: `${b.name} (${b.code})`,
  }));

  const floorOptions = (floorsData?.data || []).map((f) => ({
    value: f.id,
    label: `${f.name} (${f.code})`,
  }));

  const roomTypeOptions = (roomTypesData?.data || []).map((rt) => ({
    value: rt.id,
    label: rt.name,
  }));

  const methods = useForm<TCreateRoomInput>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      floorId: "",
      roomTypeId: "",
      name: "",
      code: "",
      capacity: 30,
      description: "",
    },
  });

  const onSubmit = async (data: TCreateRoomInput) => {
    try {
      await createRoom({
        floorId: data.floorId,
        roomTypeId: data.roomTypeId || undefined,
        name: data.name.trim(),
        code: data.code.trim().toUpperCase(),
        capacity: data.capacity ? Number(data.capacity) : undefined,
        description: data.description?.trim(),
      }).unwrap();

      toast.success("Room / Lab registered successfully 🎉");
      onOpenChange(false);
      methods.reset();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to create room");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-5 pb-3 border-b bg-card shrink-0">
          <DialogTitle>Register Room / Laboratory</DialogTitle>
          <DialogDescription>
            Add a department room, lab, or office for inventory asset allocation.
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Building Filter
                  </label>
                  <FilterSelect
                    placeholder="Building"
                    value={selectedBuildingId}
                    onChange={(val) => setSelectedBuildingId(val)}
                    options={buildingOptions}
                    includeAllOption
                    allLabel="All Buildings"
                    className="h-10!"
                  />
                </div>

                <FormSelect
                  name="floorId"
                  label="Floor / Level"
                  placeholder="Select Floor"
                  options={floorOptions}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormInput
                  name="name"
                  label="Room Name"
                  placeholder="e.g. AI & Robotics Lab"
                  disabled={isLoading}
                  required
                />

                <FormInput
                  name="code"
                  label="Room Code"
                  placeholder="e.g. LAB-304"
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormSelect
                  name="roomTypeId"
                  label="Room Type (Optional)"
                  placeholder="Select Type"
                  options={roomTypeOptions}
                  disabled={isLoading}
                />

                <FormInput
                  name="capacity"
                  label="Capacity (Seating/Occupancy)"
                  type="number"
                  placeholder="e.g. 40"
                  disabled={isLoading}
                />
              </div>

              <FormTextarea
                name="description"
                label="Description (Optional)"
                placeholder="Room purpose, equipment installed, or custody details"
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
                    Registering...
                  </>
                ) : (
                  "Create Room"
                )}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
