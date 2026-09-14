"use client";

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, LockKeyhole, Eye, EyeOff, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { FieldGroup, FieldSet } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loginSchema } from "@/validation/auth.validation";
import { FormInput } from "../shared/form/FormInput";
import { useLoginMutation } from "@/redux/api/authApi";
import { useAppDispatch } from "@/redux/hooks";
import { setUser } from "@/redux/features/authSlice";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect");
  const dispatch = useAppDispatch();

  const [showPassword, setShowPassword] = useState(false);
  const [login, { isLoading }] = useLoginMutation();

  const methods = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const onSubmit = async (data: any) => {
    try {
      const response = await login({
        identifier: data.identifier.trim(),
        password: data.password,
      }).unwrap();

      if (response.success && response.data) {
        dispatch(
          setUser({
            token: response.data.accessToken,
            user: response.data.user,
          })
        );

        toast.success(
          `Welcome back, ${response.data.user.firstName || response.data.user.username}! 👋`
        );

        const target = redirect || "/dashboard";
        router.replace(target);
      }
    } catch (error: any) {
      const apiError = error?.data;

      if (apiError?.message) {
        toast.error(apiError.message);
      } else if (apiError?.errorSources && Array.isArray(apiError.errorSources)) {
        apiError.errorSources.forEach((err: any) => {
          toast.error(err.message || "Validation error");
        });
      } else if (error?.status === "FETCH_ERROR") {
        toast.error("Unable to connect to backend server. Please check API status.");
      } else {
        toast.error("Invalid credentials or server error. Please try again.");
      }
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        <FieldSet>
          <FieldGroup>
            {/* Email / Username / Employee ID */}
            <FormInput
              name="identifier"
              label="Email / Username / Employee ID"
              type="text"
              placeholder="e.g. admin@uni.edu or EMP-101"
              startIcon={{ icon: User }}
              disabled={isLoading}
            />

            {/* Password */}
            <FormInput
              name="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your secure password"
              startIcon={{ icon: LockKeyhole }}
              disabled={isLoading}
              endIcon={{
                icon: showPassword ? EyeOff : Eye,
                onClick: () => setShowPassword((prev) => !prev),
              }}
            />
          </FieldGroup>
        </FieldSet>

        {/* Forgot password */}
        <div className="flex items-center justify-between -mt-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <ShieldCheck className="size-3.5 text-emerald-600" />
            Institutional Access Only
          </span>
          <Link
            href="/forgot-password"
            className="text-xs text-primary hover:underline font-medium"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full h-11 text-sm font-medium transition-all shadow-sm hover:shadow"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin mr-2" />
              Authenticating...
            </>
          ) : (
            <>
              Sign In to Portal
              <ArrowRight className="size-4 ml-1" />
            </>
          )}
        </Button>

        {/* Informational note replacing self-signup */}
        <div className="rounded-lg bg-muted/50 border border-border/60 p-3 text-center">
          <p className="text-xs text-muted-foreground">
            Account registration is managed by University Administration. Contact your Department Head for access credentials.
          </p>
        </div>
      </form>
    </FormProvider>
  );
}
