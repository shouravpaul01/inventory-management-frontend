"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useForm, FormProvider, FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import SectionHeader from "@/components/shared/SectionHeader";
import { Button } from "@/components/ui/button";
import { resetPasswordSchema } from "@/validation/auth.validation";
import { useResetPasswordMutation } from "@/redux/api/authApi";
import { FormInput } from "@/components/shared/form/FormInput";
import Link from "next/link";

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const router = useRouter();

  const token = params.get("token");

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const methods = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirm: "",
    },
  });

  const onSubmit = async (data: FieldValues) => {
    try {
      if (!token) {
        toast.error("Invalid or missing password reset token. Please request a new code.");
        return;
      }

      await resetPassword({
        resetToken: token,
        newPassword: data.password,
      }).unwrap();

      toast.success("Password reset successfully! Please sign in with your new credentials.");
      router.push("/login");
    } catch (error: any) {
      const message =
        error?.data?.message || "Failed to update password. Please try again.";
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border/60 bg-card p-6 md:p-8 shadow-sm">
        <div className="flex justify-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <KeyRound className="size-6" />
          </div>
        </div>

        <SectionHeader
          align="center"
          title="Create New Password"
          description="Your new password must be at least 6 characters long."
        />

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-5">
            {/* New Password */}
            <FormInput
              name="password"
              label="New Password"
              type={showPass ? "text" : "password"}
              placeholder="Enter new password"
              disabled={isLoading}
              endIcon={{
                icon: showPass ? EyeOff : Eye,
                onClick: () => setShowPass((p) => !p),
              }}
            />

            {/* Confirm Password */}
            <FormInput
              name="confirm"
              label="Confirm New Password"
              type={showConfirm ? "text" : "password"}
              placeholder="Re-enter new password"
              disabled={isLoading}
              endIcon={{
                icon: showConfirm ? EyeOff : Eye,
                onClick: () => setShowConfirm((p) => !p),
              }}
            />

            <Button
              type="submit"
              className="w-full h-11"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Updating Password...
                </>
              ) : (
                "Update Password"
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground pt-1">
              Back to{" "}
              <Link
                href="/login"
                className="text-primary font-semibold hover:underline"
              >
                Sign In
              </Link>
            </p>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}