"use client";

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Mail, Loader2, KeyRound } from "lucide-react";
import { z } from "zod";
import { useRouter } from "next/navigation";
import SectionHeader from "@/components/shared/SectionHeader";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useForgotPasswordMutation } from "@/redux/api/authApi";
import { toast } from "sonner";
import { FormInput } from "@/components/shared/form/FormInput";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
});

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: { email: string }) => {
    try {
      await forgotPassword({ email: data.email.trim() }).unwrap();
      toast.success("Security OTP sent to your institutional email.");
      router.push(`/verification?email=${encodeURIComponent(data.email.trim())}`);
    } catch (error: any) {
      toast.error(
        error?.data?.message || "Failed to process password recovery. Verify the email."
      );
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
          title="Reset Password"
          description="Enter your registered institutional email to receive a verification OTP."
        />

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-5">
            <FormInput
              name="email"
              label="Institutional Email"
              type="email"
              placeholder="faculty@uni.edu"
              startIcon={{ icon: Mail }}
              disabled={isLoading}
            />

            <Button
              type="submit"
              className="w-full h-11 flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Sending Code...
                </>
              ) : (
                <>
                  Send Recovery Code
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground pt-1">
              Remember your password?{" "}
              <Link
                href="/login"
                className="text-primary font-semibold hover:underline"
              >
                Return to sign in
              </Link>
            </p>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
