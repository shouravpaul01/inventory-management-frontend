"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { toast } from "sonner";

import SectionHeader from "@/components/shared/SectionHeader";
import { Button } from "@/components/ui/button";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { otpSchema } from "@/validation/auth.validation";
import {
  useVerifyOtpMutation,
  useResendOtpMutation,
} from "@/redux/api/authApi";
import Image from "next/image";
import { Heading } from "@/components/shared/typography";

export default function VerifyOtpPage() {
  const params = useSearchParams();
  const router = useRouter();

  const email = params.get("email");
  const forgotPassword = params.get("forgot-password");

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

  // Submit
  const onSubmit = async (data: { otp: string }) => {
    try {
      if (!email) {
        toast.error("Email not found ❌");
        return;
      }

      toast.success(
        forgotPassword === "success"
          ? "OTP verified! Reset your password."
          : "OTP verified! Please log in.",
      );

      //  redirect with email
      // forgotPassword === "success"
      //   ? router.push(`/reset-password?token=${res?.data?.reset_token}`)
      //   : router.push(`/login`);
    } catch (error: any) {
      console.log(error);

      const err = error?.data;

      // Priority based message extract
      const message =
        err?.errors?.non_field_errors?.[0] ||
        err?.errors?.email?.[0] ||
        err?.message ||
        "OTP verification failed ❌";

      toast.error(message);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    try {
      if (!email) return;

      toast.success("OTP sent again 📩");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to resend OTP ❌");
    }
  };

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <Image
          src="/images/verification.png"
          alt="verification"
          fill
          className="object-cover"
          priority
        />
      </div>
      <div className="flex flex-col p-6 md:p-10 items-center justify-center w-full">
        {" "}
        {/* w-full যোগ করুন */}
        <div className="w-full max-w-md space-y-12">
          
          <SectionHeader
          
            title="Enter OTP"
            description="We have share a code of your registered email address
kristin.watson@example.com"
          />
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* OTP */}
              <div className="flex items-center ">
                <Controller
                  name="otp"
                  control={control}
                  render={({ field }) => (
                    <InputOTP
                      maxLength={6}
                      value={field.value}
                      onChange={field.onChange}
                    >
                      <InputOTPGroup className="w-full gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <InputOTPSlot
                            key={i}
                            index={i}
                            className="bg-white size-12 border"
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  )}
                />
              </div>

              {/* Error */}
              {errors.otp && (
                <p className="text-sm text-red-500 text-center">
                  {errors.otp.message as string}
                </p>
              )}

              {/* Resend */}
              <div className="text-left">
                <Button
                variant={"link"}
                  type="button"
                  onClick={handleResend}
             
                >
                  Resend OTP
                </Button>
              </div>

              {/* Submit */}
              <Button type="submit" className="w-full h-12">
                Verify OTP
              </Button>

              {/* Back */}
              <p className="text-center text-sm text-muted-foreground pt-2">
                Wrong email?{" "}
                <Link
                  href="/forgot-password"
                  className="text-primary font-semibold hover:underline"
                >
                  Change email
                </Link>
              </p>
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  );
}
