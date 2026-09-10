"use client";

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Mail, ArrowLeft, Loader2, KeyRound } from "lucide-react";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useForgotPasswordMutation } from "@/redux/api/authApi";
import { toast } from "sonner";
import { FormInput } from "@/components/shared/form/FormInput";
import Logo from "@/components/shared/Logo";

const schema = z.object({
  email: z.string().email("Please enter a valid university email address"),
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
      const res = await forgotPassword({ email: data.email.trim() }).unwrap();
      toast.success(res?.message || "Verification code dispatched to your email.");
      router.push(`/verification?email=${encodeURIComponent(data.email.trim())}`);
    } catch (error: any) {
      toast.error(
        error?.data?.message || "Failed to process password recovery request. Please try again."
      );
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
              Recover Password
            </h1>
            <p className="text-xs text-muted-foreground">
              Enter your registered departmental email address and we will dispatch a verification code to verify your identity.
            </p>
          </div>

          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-5">
              <FormInput
                name="email"
                label="Department Email"
                type="email"
                placeholder="faculty@university.edu"
                startIcon={{ icon: Mail }}
                disabled={isLoading}
              />

              <Button
                type="submit"
                className="w-full h-11 text-sm font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Sending Code...
                  </>
                ) : (
                  <>
                    Send Recovery Code <ArrowRight className="size-4 ml-2" />
                  </>
                )}
              </Button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-medium"
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
