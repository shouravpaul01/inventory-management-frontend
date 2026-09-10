"use client";

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, LockKeyhole, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { FieldGroup, FieldSet, FieldSeparator } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import { useRouter, useSearchParams } from "next/navigation";
import { loginSchema } from "@/validation/auth.validation";
import { FormInput } from "../shared/form/FormInput";
import { Separator } from "../ui/separator";
import { GoogleIcon } from "../shared/Icon";
import SocialAuth from "./SocialAuth";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect");

  const [showPassword, setShowPassword] = useState(false);

  

  const methods = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const onSubmit = async (data: any) => {
    try {
     

      toast.success("Login successful 🎉");
      router.replace(redirect || "/");
    } catch (error: any) {
      const apiError = error?.data;

      if (apiError?.error) {
        Object.values(apiError.error).forEach((messages: any) => {
          if (Array.isArray(messages)) {
            messages.forEach((msg) => toast.error(msg));
          }
        });
        return;
      }

      // ✅ fallback
      toast.error(apiError?.message || "Login failed ❌");
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        <FieldSet>
          <FieldGroup>
            {/* Email */}
            <FormInput
              name="identifier"
              label="Email"
              type="email"
              placeholder="you@example.com"
              startIcon={{ icon: Mail }}
            />

            {/* Password */}
            <FormInput
              name="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              startIcon={{ icon: LockKeyhole }}
              endIcon={{
                icon: showPassword ? EyeOff : Eye,
                onClick: () => setShowPassword((prev) => !prev),
              }}
            />
          </FieldGroup>

          <FieldSeparator />
        </FieldSet>

        {/* Forgot password */}
        <div className="flex justify-end -mt-2">
          <Link
            href="/forgot-password"
            className="text-sm text-primary hover:underline font-medium"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit */}
        <Button type="submit" className="w-full h-12" >
         Sign In <ArrowRight />
        </Button>

      
        <SocialAuth/>

        {/* Signup */}
        <p className="text-center text-sm text-muted-foreground pt-1">
          Don’t have an account?{" "}
          <Link
            href="/register"
            className="text-primary font-semibold hover:underline"
          >
            Sign up
          </Link>
        </p>
      </form>
    </FormProvider>
  );
}
