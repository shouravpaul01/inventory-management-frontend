import LoginForm from "@/components/auth/LoginForm";
import SectionHeader from "@/components/shared/SectionHeader";
import { Heading } from "@/components/shared/typography";



import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2 ">
       <div className="relative hidden lg:block">
        <Image
          src="/images/login.png"
          alt="Beauty & Bliss"
          fill
          className="object-cover"
          priority
        />
      </div>
      <div className="flex flex-col p-6 md:p-10 items-center justify-center w-full"> {/* w-full যোগ করুন */}
        <div className="w-full max-w-lg space-y-12"> {/* w-full যোগ করুন */}
          
          <SectionHeader
            title="Welcome 👋 "
            description="Enter your credentials to access your account"
          />
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
