"use client";

import { useEffect, useState } from "react";
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
import {
  useCreateRequisitionMutation,
  useUpdateRequisitionMutation,
  useSubmitRequisitionMutation,
} from "@/redux/api/requisitionApi";
import { useGetDepartmentsQuery } from "@/redux/api/departmentApi";
import { useGetItemsQuery } from "@/redux/api/itemApi";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  createRequisitionSchema,
  TCreateRequisitionInput,
} from "@/validation/requisition.validation";
import { toast } from "sonner";
import {
  Loader2,
  FileText,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  Send,
  Save,
} from "lucide-react";
import { TRequisition } from "@/type";

interface RequisitionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requisitionToEdit?: TRequisition | null;
  onSuccess?: () => void;
}

export default function RequisitionModal({
  open,
  onOpenChange,
  requisitionToEdit,
  onSuccess,
}: RequisitionModalProps) {
  const { user } = useCurrentUser();
  const [createRequisition, { isLoading: isCreating }] = useCreateRequisitionMutation();
  const [updateRequisition, { isLoading: isUpdating }] = useUpdateRequisitionMutation();
  const [submitRequisition, { isLoading: isSubmitting }] = useSubmitRequisitionMutation();
  const [submitAfterSave, setSubmitAfterSave] = useState(false);

  const isEdit = !!requisitionToEdit;
  const isLoading = isCreating || isUpdating || isSubmitting;

  const { data: departmentsData } = useGetDepartmentsQuery({ limit: 100 });
  const departments = departmentsData?.data || [];

  const { data: itemsData } = useGetItemsQuery({ limit: 200 });
  const items = itemsData?.data || [];

  const departmentOptions = departments.map((d) => ({
    value: d.id,
    label: `${d.name} (${d.code})`,
  }));

  const itemOptions = items.map((i) => ({
    value: i.id,
    label: `${i.name} (${i.code}) - ${i.trackingType}`,
  }));

  const policyOptions = [
    { value: "PERMANENT", label: "Permanent Allocation" },
    { value: "TEMPORARY", label: "Temporary Loan (Returnable)" },
    { value: "GIFT", label: "Institutional Gift / Donated" },
  ];

  const methods = useForm<TCreateRequisitionInput>({
    resolver: zodResolver(createRequisitionSchema),
    defaultValues: {
      type: "REQUISITION",
      departmentId: user?.departmentId || "",
      purpose: "",
      remarks: "",
      isTemporary: false,
      requiredFrom: "",
      requiredUntil: "",
      lines: [
        {
          inventoryItemId: "",
          requestedQty: 1,
          requestedIssuePolicy: "PERMANENT",
          remarks: "",
        },
      ],
    },
  });

  const { control, watch, setValue, handleSubmit, reset } = methods;
  const isTemporary = watch("isTemporary");

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lines",
  });

  // Populate form if editing
  useEffect(() => {
    if (open && requisitionToEdit) {
      const existingLines = requisitionToEdit.lines || requisitionToEdit.items || [];
      reset({
        type: requisitionToEdit.type || "REQUISITION",
        departmentId: requisitionToEdit.departmentId || user?.departmentId || "",
        purpose: requisitionToEdit.purpose || "",
        remarks: requisitionToEdit.remarks || "",
        isTemporary: !!requisitionToEdit.isTemporary,
        requiredFrom: requisitionToEdit.requiredFrom
          ? new Date(requisitionToEdit.requiredFrom).toISOString().split("T")[0]
          : "",
        requiredUntil: requisitionToEdit.requiredUntil
          ? new Date(requisitionToEdit.requiredUntil).toISOString().split("T")[0]
          : "",
        lines: existingLines.length > 0
          ? existingLines.map((l: any) => ({
              inventoryItemId: l.inventoryItemId || l.itemId || "",
              requestedQty: Number(l.requestedQty || l.quantity || 1),
              requestedIssuePolicy: l.requestedIssuePolicy || "PERMANENT",
              remarks: l.remarks || "",
            }))
          : [
              {
                inventoryItemId: "",
                requestedQty: 1,
                requestedIssuePolicy: "PERMANENT",
                remarks: "",
              },
            ],
      });
    } else if (open && !requisitionToEdit) {
      reset({
        type: "REQUISITION",
        departmentId: user?.departmentId || "",
        purpose: "",
        remarks: "",
        isTemporary: false,
        requiredFrom: "",
        requiredUntil: "",
        lines: [
          {
            inventoryItemId: "",
            requestedQty: 1,
            requestedIssuePolicy: "PERMANENT",
            remarks: "",
          },
        ],
      });
    }
  }, [open, requisitionToEdit, reset, user]);

  const onSubmit = async (values: TCreateRequisitionInput) => {
    try {
      if (isEdit && requisitionToEdit) {
        await updateRequisition({
          id: requisitionToEdit.id,
          body: {
            purpose: values.purpose,
            remarks: values.remarks || undefined,
            isTemporary: values.isTemporary,
            requiredFrom: values.requiredFrom ? new Date(values.requiredFrom).toISOString() : undefined,
            requiredUntil: values.requiredUntil ? new Date(values.requiredUntil).toISOString() : undefined,
            lines: values.lines.map((l) => ({
              inventoryItemId: l.inventoryItemId,
              requestedQty: Number(l.requestedQty),
              requestedIssuePolicy: l.requestedIssuePolicy,
              remarks: l.remarks || undefined,
            })),
          },
        }).unwrap();

        if (submitAfterSave) {
          await submitRequisition(requisitionToEdit.id).unwrap();
          toast.success("Requisition updated and resubmitted to Super Admin for approval! 🎉");
        } else {
          toast.success("Requisition changes saved successfully 🎉");
        }
      } else {
        await createRequisition({
          type: values.type,
          departmentId: values.departmentId,
          purpose: values.purpose,
          remarks: values.remarks || undefined,
          isTemporary: values.isTemporary,
          requiredFrom: values.requiredFrom ? new Date(values.requiredFrom).toISOString() : undefined,
          requiredUntil: values.requiredUntil ? new Date(values.requiredUntil).toISOString() : undefined,
          lines: values.lines.map((l) => ({
            inventoryItemId: l.inventoryItemId,
            requestedQty: Number(l.requestedQty),
            requestedIssuePolicy: l.requestedIssuePolicy,
            remarks: l.remarks || undefined,
          })),
        }).unwrap();

        toast.success("Draft requisition created successfully. Submit it when ready for review.");
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to process requisition");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <FileText className="size-5" />
            {isEdit
              ? `Edit Requisition: ${requisitionToEdit.requestNumber || requisitionToEdit.requisitionNo || "Draft"}`
              : "Create Material Requisition"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modify requisition quantities, items, or justification before approval resubmission."
              : "Submit an institutional requisition for consumables, lab assets, or temporary equipment."}
          </DialogDescription>
        </DialogHeader>

        {isEdit && requisitionToEdit?.status === "REJECTED" && (
          <div className="p-3.5 rounded-lg border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 text-xs space-y-1 my-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertCircle className="size-4 text-rose-600 shrink-0" />
              <span>Super Admin Rejection Feedback to Address:</span>
            </div>
            <p className="pl-5 text-foreground leading-relaxed font-medium">
              "{requisitionToEdit.remarks || "No detailed comments provided."}"
            </p>
            <p className="pl-5 text-[11px] text-muted-foreground mt-1">
              Please modify the requested items, quantities, or justification below, then click "Save & Resubmit to Super Admin".
            </p>
          </div>
        )}

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormSelect
                name="departmentId"
                label="Target Department"
                placeholder="Select Department"
                options={departmentOptions}
                required
              />

              <FormSelect
                name="type"
                label="Request Type"
                options={[
                  { value: "REQUISITION", label: "Internal Requisition" },
                  { value: "ORDER", label: "Procurement / Purchase Order" },
                ]}
                required
              />
            </div>

            <FormInput
              name="purpose"
              label="Purpose / Justification"
              placeholder="e.g. Laboratory Practical Session CS-201 or Office Stationery for Exam Office"
              required
            />

            {/* Temporary Loan Checkbox */}
            <div className="rounded-lg border p-3.5 bg-muted/20 space-y-3">
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={isTemporary}
                  onChange={(e) => setValue("isTemporary", e.target.checked)}
                  className="rounded border-input text-primary focus:ring-primary size-4"
                />
                <span>This is a Temporary Loan (Equipment must be returned after use)</span>
              </label>

              {isTemporary && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <FormInput
                    name="requiredFrom"
                    label="Required From"
                    type="date"
                    required
                  />
                  <FormInput
                    name="requiredUntil"
                    label="Expected Return Date"
                    type="date"
                    required
                  />
                </div>
              )}
            </div>

            {/* Line Items Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Requested Items ({fields.length})
                </h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      inventoryItemId: "",
                      requestedQty: 1,
                      requestedIssuePolicy: isTemporary ? "TEMPORARY" : "PERMANENT",
                      remarks: "",
                    })
                  }
                  className="gap-1.5 text-xs h-7"
                >
                  <Plus className="size-3.5" />
                  Add Line Item
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
                      <div className="sm:col-span-7">
                        <FormSelect
                          name={`lines.${index}.inventoryItemId`}
                          label="Inventory Item"
                          placeholder="Select an item"
                          options={itemOptions}
                          required
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <FormInput
                          name={`lines.${index}.requestedQty`}
                          label="Quantity"
                          type="number"
                          placeholder="Qty"
                          required
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <FormSelect
                          name={`lines.${index}.requestedIssuePolicy`}
                          label="Issue Policy"
                          options={policyOptions}
                        />
                      </div>
                    </div>

                    <FormInput
                      name={`lines.${index}.remarks`}
                      label="Item Specific Remarks (Optional)"
                      placeholder="e.g. Model preference, color, or exact spec..."
                    />
                  </div>
                ))}
              </div>
            </div>

            <FormTextarea
              name="remarks"
              label="General Remarks / Approval Instructions"
              placeholder="Any additional notes for Department Head or Storekeeper..."
            />

            <DialogFooter className="pt-4 flex flex-col sm:flex-row items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>

              {isEdit ? (
                <>
                  <Button
                    type="submit"
                    variant="secondary"
                    disabled={isLoading}
                    onClick={() => setSubmitAfterSave(false)}
                    className="gap-1.5"
                  >
                    {isUpdating && <Loader2 className="mr-1.5 size-4 animate-spin" />}
                    <Save className="size-4" />
                    Save Changes
                  </Button>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    onClick={() => setSubmitAfterSave(true)}
                    className={
                      requisitionToEdit?.status === "REJECTED"
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                        : "gap-1.5"
                    }
                  >
                    {(isUpdating || isSubmitting) && (
                      <Loader2 className="mr-1.5 size-4 animate-spin" />
                    )}
                    <Send className="size-4" />
                    {requisitionToEdit?.status === "REJECTED"
                      ? "Save & Resubmit to Super Admin"
                      : "Save & Submit for Approval"}
                  </Button>
                </>
              ) : (
                <Button
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Create Draft Requisition
                </Button>
              )}
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
