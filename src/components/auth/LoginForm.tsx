"use client";

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, LockKeyhole, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
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
import { setCredentials } from "@/redux/features/authSlice";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [showPassword, setShowPassword] = useState(false);

  const methods = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const onSubmit = async (values: any) => {
    try {
      const isEmail = values.identifier.includes("@");
      const payload = isEmail
        ? { email: values.identifier.trim(), password: values.password }
        : { username: values.identifier.trim(), password: values.password };

      const res = await login(payload).unwrap();

      if (res.success && res.data) {
        dispatch(
          setCredentials({
            token: res.data.accessToken,
            refreshToken: res.data.refreshToken,
            user: res.data.user,
          })
        );

        toast.success(`Welcome back, ${res.data.user.firstName}! 👋`);
        router.replace(redirect);
      }
    } catch (error: any) {
      const apiError = error?.data;

      if (apiError?.message) {
        toast.error(apiError.message);
      } else if (apiError?.errorSources && Array.isArray(apiError.errorSources)) {
        apiError.errorSources.forEach((err: any) => toast.error(err.message));
      } else {
        toast.error("Invalid credentials or authentication error. Please try again.");
      }
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        <FieldSet>
          <FieldGroup className="space-y-4">
            <FormInput
              name="identifier"
              label="Email, Username or Employee ID"
              placeholder="admin@gmail.com or superadmin"
              startIcon={{ icon: User }}
              disabled={isLoading}
            />

            <FormInput
              name="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your security password"
              startIcon={{ icon: LockKeyhole }}
              endIcon={{
                icon: showPassword ? EyeOff : Eye,
                onClick: () => setShowPassword((prev) => !prev),
              }}
              disabled={isLoading}
            />
          </FieldGroup>
        </FieldSet>

        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Authorized University Personnel Only</span>
          <Link
            href="/forgot-password"
            className="text-primary font-medium hover:underline focus:outline-hidden"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full h-11 text-sm font-semibold shadow-md transition-all"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin mr-2" />
              Authenticating...
            </>
          ) : (
            <>
              Sign In to Portal <ArrowRight className="size-4 ml-2" />
            </>
          )}
        </Button>

        <div className="rounded-lg bg-muted/50 p-3.5 border text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">University Access Notice</p>
          <p>
            User accounts are provisioned and managed by department administrators. Self-registration is restricted.
          </p>
        </div>
      </form>
    </FormProvider>
  );
}
