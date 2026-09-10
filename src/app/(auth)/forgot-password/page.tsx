"use client";

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Mail } from "lucide-react";
import { z } from "zod";
import { useRouter } from "next/navigation";

import SectionHeader from "@/components/shared/SectionHeader";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useForgotPasswordMutation } from "@/redux/api/authApi";
import { toast } from "sonner";
import { FormInput } from "@/components/shared/form/FormInput";
import Image from "next/image";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

export default function ForgotPasswordPage() {
  const router = useRouter();

  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: { email: string }) => {
    try {
      toast.success(
        "OTP has been sent to your email. Please check your inbox.",
      );

      router.push(
        `/verification?forgot-password=success&email=${encodeURIComponent(data.email)}`,
      );
    } catch (error: any) {
      console.log("error", error);
      toast.error(
        error?.data?.error?.email[0] || "Failed to send OTP. Please try again.",
      );
    }
  };

  return (
    <div
      className="grid min-h-svh lg:grid-cols-2 
  "
    >
      <div className="relative hidden lg:block">
        <Image
          src="/images/forgot-password.png"
          alt="Beauty & Bliss"
          fill
          className="object-cover"
          priority
        />
      </div>
      <div className="flex flex-col p-6 md:p-10 items-center justify-center w-full">
        {" "}
        {/* w-full যোগ করুন */}
        <div className="w-full max-w-md space-y-8">
          <SectionHeader
            title="Forgot Password"
            description="Enter your registered email address. we’ll send you a code to reset your password."
          />
          {/* w-full যোগ করুন */}
          <FormProvider {...methods}>
            <form
              onSubmit={methods.handleSubmit(onSubmit)}
              className="space-y-5"
            >
              <div>
                <FormInput
                  name="email"
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  startIcon={{ icon: Mail }}
                />
                <p className="text-sm text-muted-foreground pt-2">
                  Remember the password ?{" "}
                  <Link
                    href="/login"
                    className="text-primary font-semibold hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-12 flex items-center justify-center gap-2 cursor-pointer"
              >
                Send OTP
                <ArrowRight size={16} />
              </Button>
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  );
}
