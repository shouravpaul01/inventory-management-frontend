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
import { useCreateDistributionMutation } from "@/redux/api/distributionApi";
import { useGetRequisitionsQuery } from "@/redux/api/requisitionApi";
import { useGetUsersQuery } from "@/redux/api/userApi";
import { useGetStockLocationsQuery } from "@/redux/api/locationApi";
import { useGetItemsQuery } from "@/redux/api/itemApi";
import { useGetUnitsQuery } from "@/redux/api/unitApi";
import {
  createDistributionSchema,
  TCreateDistributionInput,
} from "@/validation/distribution.validation";
import { toast } from "sonner";
import {
  Loader2,
  SendHorizontal,
  Plus,
  Trash2,
  PackageCheck,
  MapPin,
} from "lucide-react";

interface DistributionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultRequisitionId?: string;
}

export default function DistributionModal({
  open,
  onOpenChange,
  defaultRequisitionId,
}: DistributionModalProps) {
  const [createDistribution, { isLoading }] = useCreateDistributionMutation();

  // Query approved requisitions ready for fulfillment
  const { data: reqsData } = useGetRequisitionsQuery({
    status: "APPROVED",
    limit: 50,
  });
  const approvedReqs = reqsData?.data || [];

  const { data: usersData } = useGetUsersQuery({ limit: 100 });
  const users = usersData?.data || [];

  const { data: locationsData } = useGetStockLocationsQuery({ limit: 50 });
  const locations = locationsData?.data || [];

  const { data: itemsData } = useGetItemsQuery({ limit: 100 });
  const items = itemsData?.data || [];

  const { data: unitsData } = useGetUnitsQuery({
    status: "AVAILABLE",
    limit: 100,
  });
  const availableUnits = unitsData?.data || [];

  const requisitionOptions = approvedReqs.map((r) => ({
    value: r.id,
    label: `${r.requestNumber || r.requisitionNo} - ${r.purpose.slice(0, 30)}`,
  }));

  const userOptions = users.map((u) => ({
    value: u.id,
    label: `${u.firstName} ${u.lastName} (${u.email})`,
  }));

  const locationOptions = locations.map((loc) => ({
    value: loc.id,
    label: `${loc.name} (${loc.code})`,
  }));

  const itemOptions = items.map((i) => ({
    value: i.id,
    label: `${i.name} (${i.code})`,
  }));

  const unitOptions = availableUnits.map((u) => ({
    value: u.id,
    label: `${u.uniqueCode} - ${u.inventoryItem?.name || "Unit"} (${u.condition})`,
  }));

  const handoverOptions = [
    { value: "SELF_COLLECTION", label: "Self Collection at Central Store" },
    { value: "DELIVERED_BY_STAFF", label: "Storekeeper / Peon Office Delivery" },
    { value: "COURIER", label: "Courier / Institutional Vehicle" },
    { value: "OTHER", label: "Other Handover Method" },
  ];

  const conditionOptions = [
    { value: "NEW", label: "Brand New (Unopened)" },
    { value: "GOOD", label: "Good Working Condition" },
    { value: "FAIR", label: "Fair / Used" },
    { value: "DAMAGED", label: "Damaged / Defect" },
  ];

  const methods = useForm<TCreateDistributionInput>({
    resolver: zodResolver(createDistributionSchema),
    defaultValues: {
      requisitionId: defaultRequisitionId || "",
      receiverId: "",
      issueMode: "PERMANENT",
      handoverMethod: "SELF_COLLECTION",
      expectedReturnAt: "",
      remarks: "",
      lines: [
        {
          inventoryItemId: "",
          inventoryUnitId: "",
          locationId: "",
          quantity: 1,
          issueMode: "PERMANENT",
          condition: "GOOD",
          remarks: "",
        },
      ],
    },
  });

  const { control, watch, setValue, handleSubmit, reset } = methods;
  const selectedReqId = watch("requisitionId");

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lines",
  });

  // When requisition is selected, auto-populate receiver and lines
  useEffect(() => {
    if (!open) return;
    if (selectedReqId) {
      const foundReq = approvedReqs.find((r) => r.id === selectedReqId);
      if (foundReq) {
        if (foundReq.requesterId) {
          setValue("receiverId", foundReq.requesterId);
        }
        if (foundReq.isTemporary) {
          setValue("issueMode", "TEMPORARY");
        }

        const reqLines = foundReq.lines || foundReq.items || [];
        if (reqLines.length > 0) {
          const mappedLines = reqLines.map((rl) => ({
            requisitionLineId: rl.id,
            inventoryItemId: rl.inventoryItemId,
            inventoryUnitId: "",
            locationId: locations[0]?.id || "",
            quantity: rl.approvedQty > 0 ? rl.approvedQty : rl.requestedQty,
            issueMode: (rl.requestedIssuePolicy || "PERMANENT") as "PERMANENT" | "TEMPORARY" | "GIFT",
            condition: "GOOD" as const,
            remarks: rl.remarks || "",
          }));
          setValue("lines", mappedLines);
        }
      }
    }
  }, [selectedReqId, approvedReqs, setValue, locations, open]);

  const onSubmit = async (values: TCreateDistributionInput) => {
    try {
      await createDistribution({
        requisitionId: values.requisitionId,
        receiverId: values.receiverId,
        issueMode: values.issueMode,
        handoverMethod: values.handoverMethod,
        expectedReturnAt: values.expectedReturnAt
          ? new Date(values.expectedReturnAt).toISOString()
          : undefined,
        remarks: values.remarks || undefined,
        lines: values.lines.map((l) => ({
          requisitionLineId: l.requisitionLineId || undefined,
          inventoryItemId: l.inventoryItemId,
          inventoryUnitId: l.inventoryUnitId || undefined,
          locationId: l.locationId,
          quantity: Number(l.quantity),
          issueMode: l.issueMode,
          condition: l.condition,
          remarks: l.remarks || undefined,
        })),
      }).unwrap();

      toast.success("Items dispatched and stock balances deducted successfully.");
      reset();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to dispatch distribution");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <SendHorizontal className="size-5" />
            Dispatch Material Distribution
          </DialogTitle>
          <DialogDescription>
            Fulfill approved requisition lines, deduct stock balances, or assign serialized units.
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormSelect
                name="requisitionId"
                label="Approved Requisition"
                placeholder="Select approved requisition"
                options={requisitionOptions}
                required
              />

              <FormSelect
                name="receiverId"
                label="Designated Recipient"
                placeholder="Select receiver"
                options={userOptions}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormSelect
                name="handoverMethod"
                label="Handover / Delivery Method"
                options={handoverOptions}
                required
              />

              <FormSelect
                name="issueMode"
                label="Allocation Policy"
                options={[
                  { value: "PERMANENT", label: "Permanent Allocation" },
                  { value: "TEMPORARY", label: "Temporary Loan (Returnable)" },
                  { value: "GIFT", label: "Gift / Institutional Award" },
                ]}
                required
              />
            </div>

            {/* Distribution Lines Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Dispatched Items ({fields.length})
                </h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      inventoryItemId: "",
                      inventoryUnitId: "",
                      locationId: locations[0]?.id || "",
                      quantity: 1,
                      issueMode: "PERMANENT",
                      condition: "GOOD",
                      remarks: "",
                    })
                  }
                  className="gap-1.5 text-xs h-7"
                >
                  <Plus className="size-3.5" />
                  Add Dispatch Item
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
                        Line #{index + 1}
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
                          name={`lines.${index}.locationId`}
                          label="Source Stock Location"
                          placeholder="Source location"
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

                    {/* Serialized Unit & Condition */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormSelect
                        name={`lines.${index}.inventoryUnitId`}
                        label="Specific Asset Unit Tag (If Serialized)"
                        placeholder="Optional physical unit"
                        options={unitOptions}
                      />

                      <FormSelect
                        name={`lines.${index}.condition`}
                        label="Dispatched Condition"
                        options={conditionOptions}
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <FormTextarea
              name="remarks"
              label="Gate Pass / Delivery Challan Remarks"
              placeholder="Challan #, transport vehicle number, or packaging remarks..."
            />

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
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                Confirm Dispatch & Issue
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
