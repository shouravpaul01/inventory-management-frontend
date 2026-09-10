"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Loader2, KeyRound } from "lucide-react";

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
import Logo from "@/components/shared/Logo";

export default function VerifyOtpPage() {
  const params = useSearchParams();
  const router = useRouter();

  const email = params.get("email");

  const [verifyResetOtp, { isLoading }] = useVerifyResetOtpMutation();
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
        toast.error("Email not found in verification request.");
        return;
      }

      const res = await verifyResetOtp({
        email,
        otp: data.otp,
      }).unwrap();

      if (res.success && res.data?.resetToken) {
        toast.success("Security code verified successfully.");
        router.push(`/reset-password?token=${encodeURIComponent(res.data.resetToken)}`);
      }
    } catch (error: any) {
      const apiError = error?.data;
      toast.error(apiError?.message || "Invalid or expired verification code.");
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error("No email associated with this session.");
      return;
    }

    try {
      await resendOtp({ email }).unwrap();
      toast.success("A new verification code has been dispatched.");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to resend code. Please try again later.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center pb-2">
          <Logo href="/login" />
        </div>

        <div className="rounded-2xl border bg-card p-8 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
              <KeyRound className="size-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Two-Factor Verification
            </h1>
            <p className="text-xs text-muted-foreground">
              Please enter the 6-digit security code transmitted to{" "}
              <span className="font-semibold text-foreground">{email || "your email"}</span>
            </p>
          </div>

          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex flex-col items-center justify-center space-y-2">
                <Controller
                  name="otp"
                  control={control}
                  render={({ field }) => (
                    <InputOTP
                      maxLength={6}
                      value={field.value}
                      onChange={field.onChange}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  )}
                />
                {errors.otp && (
                  <p className="text-xs text-destructive text-center">
                    {errors.otp.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-sm font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Validating Code...
                  </>
                ) : (
                  "Verify & Proceed"
                )}
              </Button>

              <div className="flex flex-col items-center gap-3 pt-2 text-xs text-muted-foreground">
                <p>
                  Didn’t receive the code?{" "}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending}
                    className="text-primary font-semibold hover:underline disabled:opacity-50"
                  >
                    {isResending ? "Resending..." : "Resend Code"}
                  </button>
                </p>

                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground font-medium"
                >
                  <ArrowLeft className="size-3" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  );
}
