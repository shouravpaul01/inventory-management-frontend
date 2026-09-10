"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useForm, FormProvider, FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import SectionHeader from "@/components/shared/SectionHeader";
import { Button } from "@/components/ui/button";
import { resetPasswordSchema } from "@/validation/auth.validation";
import { useResetPasswordMutation } from "@/redux/api/authApi";
import { FormInput } from "@/components/shared/form/FormInput";

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
     
    },
  });

  const { handleSubmit } = methods;

 

  // ✅ Submit
  const onSubmit = async (data: FieldValues) => {
    try {
     

      if (!token) {
        toast.error("Token not found ❌");
        return;
      }

      await resetPassword({
        reset_token:token,
        password: data.password,
      
      }).unwrap();

      toast.success("Password reset successful 🎉");

    
      router.push("/login");
    } catch (error: any) {
      console.log(error)
      const err = error?.data;

      const message =
        err?.errors?.non_field_errors?.[0] ||
        err?.errors?.password?.[0] ||
        err?.message ||
        "Failed to reset password ❌";

      toast.error(message);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">

        <SectionHeader
          align="center"
          title="Create New Password"
          description="Your password must be different from previously used passwords"
        />

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* New Password */}
            <FormInput
              name="password"
              label="New Password"
              type={showPass ? "text" : "password"}
              placeholder="Enter new password"
              endIcon={{
                icon: showPass ? EyeOff : Eye,
                onClick: () => setShowPass((p) => !p),
              }}
            />

            {/* Confirm Password */}
            <FormInput
              name="confirm"
              label="Confirm Password"
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm password"
              endIcon={{
                icon: showConfirm ? EyeOff : Eye,
                onClick: () => setShowConfirm((p) => !p),
              }}
            />

            {/* Submit */}
            <Button type="submit" className="w-full h-12" disabled={isLoading}>
              {isLoading ? "Resetting..." : "Reset Password"}
            </Button>

          </form>
        </FormProvider>
      </div>
    </div>
  );
}