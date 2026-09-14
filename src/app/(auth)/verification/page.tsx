"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { toast } from "sonner";
import { KeyRound, Loader2 } from "lucide-react";

import SectionHeader from "@/components/shared/SectionHeader";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { otpSchema } from "@/validation/auth.validation";
import {
  useVerifyResetOtpMutation,
  useForgotPasswordMutation,
} from "@/redux/api/authApi";

export default function VerifyOtpPage() {
  const params = useSearchParams();
  const router = useRouter();

  const email = params.get("email");
  const [verifyOtp, { isLoading }] = useVerifyResetOtpMutation();
  const [resendOtp, { isLoading: isResending }] = useForgotPasswordMutation();

  const methods = useForm({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = methods;

  const onSubmit = async (data: { otp: string }) => {
    try {
      if (!email) {
        toast.error("Email address missing. Please request a new code.");
        return;
      }

      const res = await verifyOtp({
        email: email.trim(),
        otp: data.otp.trim(),
      }).unwrap();

      toast.success("Security code verified! You can now reset your password.");
      router.push(`/reset-password?token=${res.data.resetToken}`);
    } catch (error: any) {
      const message =
        error?.data?.message || "Verification code is invalid or has expired.";
      toast.error(message);
    }
  };

  const handleResend = async () => {
    try {
      if (!email) return;
      await resendOtp({ email: email.trim() }).unwrap();
      toast.success("New 6-digit code has been dispatched to your email.");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to resend code.");
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
          title="Security Verification"
          description={
            email
              ? `Enter the 6-digit verification code sent to ${email}`
              : "Enter the 6-digit code sent to your institutional email"
          }
        />

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex justify-center">
              <Controller
                name="otp"
                control={control}
                render={({ field }) => (
                  <InputOTP
                    maxLength={6}
                    value={field.value}
                    onChange={field.onChange}
                  >
                    <InputOTPGroup className="gap-2 sm:gap-3">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <InputOTPSlot
                          key={i}
                          index={i}
                          className="size-11 sm:size-12 text-base font-semibold border-border"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                )}
              />
            </div>

            {errors.otp && (
              <p className="text-xs text-destructive text-center font-medium">
                {errors.otp.message as string}
              </p>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Didn't receive the code?</span>
              <Button
                variant="link"
                type="button"
                className="h-auto p-0 text-xs text-primary"
                onClick={handleResend}
                disabled={isResending}
              >
                {isResending ? "Sending..." : "Resend Code"}
              </Button>
            </div>

            <Button
              type="submit"
              className="w-full h-11"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                "Verify & Continue"
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Wrong email address?{" "}
              <Link
                href="/forgot-password"
                className="text-primary font-medium hover:underline"
              >
                Change email
              </Link>
            </p>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
