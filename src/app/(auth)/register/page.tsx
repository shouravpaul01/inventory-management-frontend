import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import SectionHeader from "@/components/shared/SectionHeader";
import { Heading } from "@/components/shared/typography";

import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="grid h-screen lg:grid-cols-2 overflow-hidden">

      {/* LEFT SIDE (FIXED IMAGE) */}
      <div className="relative hidden lg:block h-screen">
        <Image
          src="/images/register.png"
          alt="Beauty & Bliss"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* RIGHT SIDE (SCROLLABLE) */}
      <div className="flex flex-col items-center justify-center w-full h-screen overflow-y-auto p-6 md:p-10">

        <div className="w-full max-w-lg space-y-8 ">

       

          <SectionHeader
            title="Create New Account"
            description="Please enter details"
          />

          <RegisterForm />

        </div>
      </div>
    </div>
  );
}