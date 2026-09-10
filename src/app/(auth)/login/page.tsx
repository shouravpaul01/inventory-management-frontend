import LoginForm from "@/components/auth/LoginForm";
import Logo from "@/components/shared/Logo";
import { Shield, Layers, QrCode, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left hero side (desktop) */}
      <div className="relative hidden lg:flex flex-col justify-between bg-zinc-950 text-white p-12 overflow-hidden border-r border-zinc-800">
        <div className="absolute inset-0 bg-radial from-zinc-800/40 via-zinc-950 to-zinc-950 pointer-events-none" />

        <div className="relative z-10">
          <Logo href="/login" className="text-white" />
        </div>

        <div className="relative z-10 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1 text-xs text-zinc-300 backdrop-blur-md">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            University Department System v1.0
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-zinc-100">
            Complete Department Inventory & Asset Lifecycle Management
          </h1>

          <p className="text-zinc-400 text-sm leading-relaxed">
            Multi-location stock tracking, serialized unit management with QR verification, configurable approvals, and immutable movement ledgers.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 text-xs">
            <div className="flex items-start gap-2.5 text-zinc-300">
              <QrCode className="size-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Serialized QR/Barcode Tracking</span>
            </div>
            <div className="flex items-start gap-2.5 text-zinc-300">
              <Shield className="size-4 text-blue-400 shrink-0 mt-0.5" />
              <span>Role & Permission Security</span>
            </div>
            <div className="flex items-start gap-2.5 text-zinc-300">
              <Layers className="size-4 text-amber-400 shrink-0 mt-0.5" />
              <span>Multi-Location Hierarchies</span>
            </div>
            <div className="flex items-start gap-2.5 text-zinc-300">
              <CheckCircle2 className="size-4 text-purple-400 shrink-0 mt-0.5" />
              <span>Configurable Approval Flows</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-zinc-500">
          © {new Date().getFullYear()} University Academic Department. All rights reserved.
        </div>
      </div>

      {/* Right form side */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-10 lg:p-14 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex justify-center pb-2">
            <Logo href="/login" />
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Sign In to Your Account
            </h2>
            <p className="text-sm text-muted-foreground">
              Enter your university credentials to access the inventory system
            </p>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
