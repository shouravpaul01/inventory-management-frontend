"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormInput } from "@/components/shared/form/FormInput";
import { FormTextarea } from "@/components/shared/form/FormTextarea";
import { FormSelect } from "@/components/shared/form/FormSelect";
import { useRequisitionCart } from "@/context/RequisitionCartContext";
import { useCreateRequisitionMutation } from "@/redux/api/requisitionApi";
import { useGetDepartmentsQuery } from "@/redux/api/departmentApi";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { toast } from "sonner";
import {
  Send,
  Loader2,
  Calendar,
  Layers,
  Clock,
  Gift,
  Building2,
  FileText,
  AlertCircle,
  Package,
} from "lucide-react";

const checkoutSchema = z
  .object({
    type: z.enum(["REQUISITION", "ORDER"]),
    departmentId: z.string().min(1, "Department is required"),
    purpose: z.string().min(3, "Purpose must be at least 3 characters"),
    remarks: z.string().optional(),
    isTemporary: z.boolean(),
    requiredFrom: z.string().optional(),
    requiredUntil: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.isTemporary && !data.requiredUntil) {
        return false;
      }
      return true;
    },
    {
      message: "Required Until date is required for temporary loans",
      path: ["requiredUntil"],
    }
  );

type TCheckoutInput = z.infer<typeof checkoutSchema>;

interface RequisitionCheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBackToCart: () => void;
}

export default function RequisitionCheckoutDialog({
  open,
  onOpenChange,
  onBackToCart,
}: RequisitionCheckoutDialogProps) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const { cart, clearCart, totalItems, totalUnits } = useRequisitionCart();

  const { data: deptsData } = useGetDepartmentsQuery({ limit: 100 });
  const departments = deptsData?.data || [];

  const [createRequisition, { isLoading }] = useCreateRequisitionMutation();

  const departmentOptions = departments.map((d) => ({
    value: d.id,
    label: `${d.name} (${d.code})`,
  }));

  // Check if any cart item has TEMPORARY policy
  const hasTempItems = cart.some((ci) => ci.policy === "TEMPORARY");

  const methods = useForm<TCheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      type: "REQUISITION",
      departmentId: user?.departmentId || "",
      purpose: "",
      remarks: "",
      isTemporary: hasTempItems,
      requiredFrom: "",
      requiredUntil: "",
    },
  });

  const { watch, setValue, reset, handleSubmit } = methods;
  const selectedType = watch("type");
  const isTemporary = watch("isTemporary");

  // Sync user department and temporary policy when opened
  useEffect(() => {
    if (!open) return;
    if (user?.departmentId) {
      setValue("departmentId", user.departmentId);
    }
    if (hasTempItems) {
      setValue("isTemporary", true);
    }
  }, [open, user?.departmentId, hasTempItems, setValue]);

  const onSubmit = async (data: TCheckoutInput) => {
    if (cart.length === 0) {
      toast.error("Your request cart is empty.");
      return;
    }

    try {
      const payload = {
        type: data.type,
        departmentId: data.departmentId,
        purpose: data.purpose.trim(),
        remarks: data.remarks?.trim() || undefined,
        isTemporary: data.isTemporary,
        requiredFrom: data.requiredFrom ? new Date(data.requiredFrom).toISOString() : undefined,
        requiredUntil: data.requiredUntil ? new Date(data.requiredUntil).toISOString() : undefined,
        lines: cart.map((ci) => ({
          inventoryItemId: ci.item.id,
          requestedQty: ci.quantity,
          requestedIssuePolicy: ci.policy,
          remarks: ci.remarks?.trim() || undefined,
        })),
      };

      const res = await createRequisition(payload).unwrap();
      const reqNumber = res?.data?.requestNumber || res?.data?.requisitionNo || "New Request";

      toast.success(`Requisition "${reqNumber}" submitted successfully! 🎉`);
      clearCart();
      reset();
      onOpenChange(false);
      router.push("/requisitions");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to submit requisition");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="p-5 pb-3 border-b bg-card shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
            <FileText className="size-5 text-primary" />
            <span>Complete Requisition Submission</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Specify request justification, select department allocation, and submit {totalItems} line items ({totalUnits} units).
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...methods}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex-1 overflow-hidden flex flex-col min-h-0"
          >
            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
              {/* Request Type Switcher */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Request Classification
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setValue("type", "REQUISITION")}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                      selectedType === "REQUISITION"
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "border-border/70 hover:border-border bg-card"
                    }`}
                  >
                    <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <Layers className="size-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">
                        Material Requisition
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Issue from existing central store stock
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setValue("type", "ORDER")}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                      selectedType === "ORDER"
                        ? "border-purple-600 bg-purple-500/5 ring-1 ring-purple-600/30"
                        : "border-border/70 hover:border-border bg-card"
                    }`}
                  >
                    <div className="size-8 rounded-lg bg-purple-600/10 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Send className="size-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">
                        Procurement Order
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Purchase or indent out-of-stock items
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Department Selector */}
              <div className="space-y-1">
                <FormSelect
                  name="departmentId"
                  label="Charging / Receiving Department"
                  placeholder="Select Department"
                  options={departmentOptions}
                  required
                />
              </div>

              {/* Purpose & Justification */}
              <div className="space-y-1">
                <FormTextarea
                  name="purpose"
                  label="Purpose & Official Justification"
                  placeholder="e.g. Required for undergraduate Electrical Engineering Lab experimentation & midterm evaluations..."
                  rows={2}
                  required
                />
              </div>

              {/* Loan / Temporary Toggle and Dates */}
              <div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Clock className="size-3.5 text-amber-500" />
                      Temporary Equipment Loan / Checkout
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Enable if supplies are borrowed temporarily and must be returned to the department store.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    id="isTemporaryCheckout"
                    checked={isTemporary}
                    onChange={(e) => setValue("isTemporary", e.target.checked)}
                    className="size-4 rounded border-input text-primary focus:ring-primary cursor-pointer"
                  />
                </div>

                {isTemporary && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/40">
                    <FormInput
                      name="requiredFrom"
                      label="Required From Date"
                      type="date"
                    />
                    <FormInput
                      name="requiredUntil"
                      label="Required Until (Expected Return)"
                      type="date"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Line Items Summary Preview */}
              <div className="space-y-2 pt-2 border-t border-border/60">
                <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                  <span>Selected Supplies ({cart.length} items)</span>
                  <span className="text-muted-foreground font-mono">{totalUnits} units total</span>
                </div>

                <div className="max-h-36 overflow-y-auto rounded-lg border border-border/70 bg-muted/20 divide-y divide-border/40 text-xs">
                  {cart.map((ci) => (
                    <div
                      key={ci.item.id}
                      className="p-2.5 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Package className="size-4 text-muted-foreground shrink-0" />
                        <span className="font-medium text-foreground truncate">
                          {ci.item.name}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          ({ci.item.code})
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                          {ci.policy}
                        </Badge>
                        <span className="font-mono font-bold text-foreground">
                          x{ci.quantity} {ci.item.unitName || "units"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* General Remarks */}
              <div className="space-y-1">
                <FormTextarea
                  name="remarks"
                  label="General Remarks / Delivery Instructions (Optional)"
                  placeholder="e.g. Deliver to Room 402, Building A or notify Lab Assistant upon arrival..."
                  rows={2}
                />
              </div>
            </div>

            {/* Fixed Footer */}
            <DialogFooter className="p-4 border-t bg-card shrink-0 flex items-center justify-between gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={onBackToCart}
                disabled={isLoading}
                size="sm"
                className="text-xs"
              >
                Back to Cart
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                  size="sm"
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  size="sm"
                  className="gap-2 text-xs font-semibold shadow-xs"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Submitting Request...
                    </>
                  ) : (
                    <>
                      <Send className="size-3.5" />
                      Confirm & Submit Requisition
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
