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
import { FormTextarea } from "@/components/shared/form/FormTextarea";
import { FormSelect } from "@/components/shared/form/FormSelect";
import { useConfirmDeliveryMutation } from "@/redux/api/distributionApi";
import {
  confirmDeliverySchema,
  TConfirmDeliveryInput,
} from "@/validation/distribution.validation";
import { toast } from "sonner";
import {
  CheckCircle2,
  PackageCheck,
  Upload,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { TDistribution } from "@/type";

interface DeliveryConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  distribution: TDistribution | null;
}

export default function DeliveryConfirmModal({
  open,
  onOpenChange,
  distribution,
}: DeliveryConfirmModalProps) {
  const [confirmDelivery, { isLoading }] = useConfirmDeliveryMutation();
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);

  const methods = useForm<TConfirmDeliveryInput>({
    resolver: zodResolver(confirmDeliverySchema),
    defaultValues: {
      deliveryStatus: "RECEIVED",
      receiverRemarks: "",
    },
  });
  const { reset } = methods;

  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSignatureFile(file);
      setSignaturePreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (values: TConfirmDeliveryInput) => {
    if (!distribution) return;
    try {
      const formData = new FormData();
      formData.append(
        "data",
        JSON.stringify({
          deliveryStatus: values.deliveryStatus,
          receiverRemarks: values.receiverRemarks || undefined,
        })
      );
      if (signatureFile) {
        formData.append("signature", signatureFile);
      }

      await confirmDelivery({
        id: distribution.id,
        body: formData,
      }).unwrap();

      toast.success("Delivery receipt acknowledged and recorded successfully.");
      reset();
      setSignatureFile(null);
      setSignaturePreview(null);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to confirm delivery");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
        {distribution && (
          <>
            <DialogHeader className="p-5 pb-3 border-b bg-card shrink-0">
              <DialogTitle className="flex items-center gap-2 text-emerald-600 font-bold">
                <PackageCheck className="size-5" />
                Acknowledge Delivery: {distribution.distributionNo}
              </DialogTitle>
              <DialogDescription>
                Confirm physical receipt of dispatched supplies and provide recipient signature proof.
              </DialogDescription>
            </DialogHeader>

            <FormProvider {...methods}>
              <form onSubmit={methods.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  <FormSelect
              name="deliveryStatus"
              label="Delivery Status"
              options={[
                { value: "RECEIVED", label: "Goods Received & Accepted (All items intact)" },
                { value: "DELIVERED", label: "Delivered (Awaiting Inspection)" },
                { value: "REJECTED", label: "Rejected (Damage or Incorrect Specification)" },
                { value: "FAILED", label: "Failed Delivery (Recipient Unavailable)" },
              ]}
              required
            />

            <FormTextarea
              name="receiverRemarks"
              label="Recipient Remarks (Optional)"
              placeholder="e.g. Received in good order, all 5 items inspected and functional..."
            />

            {/* Signature or Signed Challan Upload */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">
                Proof of Receipt (Signed Challan Photo or Signature)
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-3 py-2 border rounded-md border-dashed cursor-pointer hover:bg-muted/50 text-xs text-muted-foreground transition-colors">
                  <Upload className="size-4" />
                  <span>{signatureFile ? signatureFile.name : "Upload signed slip"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleSignatureChange}
                  />
                </label>
                {signaturePreview && (
                  <div className="relative size-10 rounded border overflow-hidden shrink-0">
                    <img
                      src={signaturePreview}
                      alt="Signature Preview"
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
                  Confirm Receipt
                </Button>
              </DialogFooter>
            </form>
          </FormProvider>
        </>
        )}
      </DialogContent>
    </Dialog>
  );
}
