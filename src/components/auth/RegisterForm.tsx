"use client";

import { useState } from "react";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, ArrowRight, LockKeyhole, Mail, User } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import { registerSchema } from "@/validation/auth.validation";
import { useRegisterUserMutation } from "@/redux/api/authApi";
import Link from "next/link";
import TermsDialog from "./TermsDialog";
import { Checkbox } from "../ui/checkbox";
import { FormInput } from "../shared/form/FormInput";
import SocialAuth from "./SocialAuth";

export default function RegisterForm() {
  const router = useRouter();

  const [openTerms, setOpenTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const methods = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: "",
      email: "",

      password: "",
      confirm_password: "",
      isAgree: false,
    },
  });

  const { handleSubmit, reset, control, setValue } = methods;

  const onSubmit = async (data: any) => {
    try {
      toast.success("Registration successful 🎉");
      router.push(`/login`);
      reset();
    } catch (error: any) {
      toast.error(error?.data?.message || "Something went wrong ❌");
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* NAME */}
        <FormInput
          name="full_name"
          label="Full Name"
          placeholder="Enter your name"
          startIcon={{ icon: User }}
        />

        {/* EMAIL */}
        <FormInput
          name="email"
          label="Email"
          placeholder="you@example.com"
          startIcon={{ icon: Mail }}
        />

        {/* PASSWORD */}
        <FormInput
          name="password"
          label="Password"
          placeholder="Enter your password"
          type={showPassword ? "text" : "password"}
          startIcon={{ icon: LockKeyhole }}
          endIcon={{
            icon: showPassword ? EyeOff : Eye,
            onClick: () => setShowPassword((p) => !p),
          }}
        />

        {/* CONFIRM PASSWORD */}
        <FormInput
          name="confirm_password"
          label="Confirm Password"
          placeholder="Confirm password"
          type={showConfirm ? "text" : "password"}
          startIcon={{ icon: LockKeyhole }}
          endIcon={{
            icon: showConfirm ? EyeOff : Eye,
            onClick: () => setShowConfirm((p) => !p),
          }}
        />
        <div className="flex items-center gap-2">
          <Controller
            name="isAgree"
            control={methods.control}
            render={({ field }) => (
              <Checkbox
                checked={field.value}
                onCheckedChange={(val) => field.onChange(val)}
              />
            )}
          />

          <p className="text-sm text-muted-foreground">
            I agree to{" "}
            <span
              onClick={() => setOpenTerms(true)}
              className="text-primary underline cursor-pointer"
            >
              Terms & Conditions
            </span>
          </p>
        </div>

        {methods.formState.errors.isAgree && (
          <p className="text-xs text-red-500">
            {methods.formState.errors.isAgree.message as string}
          </p>
        )}
        {/* SUBMIT */}
        <Button type="submit" className="w-full h-12">
          Sign Up <ArrowRight />
        </Button>
        <SocialAuth />
        {/* LOGIN LINK */}
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-semibold">
            Sign In
          </Link>
        </p>
      </form>
      {/* TERMS DIALOG */}{" "}
      <TermsDialog
        open={openTerms}
        onOpenChange={setOpenTerms}
        control={control}
        setValue={setValue}
      />
    </FormProvider>
  );
}
