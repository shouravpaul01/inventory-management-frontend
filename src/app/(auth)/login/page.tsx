import LoginForm from "@/components/auth/LoginForm";
import SectionHeader from "@/components/shared/SectionHeader";
import {
  Boxes,
  ShieldCheck,
  ClipboardCheck,
  QrCode,
  Sparkles,
} from "lucide-react";

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* LEFT SIDE BRANDING HERO */}
      <div className="relative hidden lg:flex flex-col justify-between bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-12 text-white border-r border-slate-800/80 overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top brand header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
            <Boxes className="size-6" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white">
              UniInventory
            </span>
            <span className="block text-xs text-slate-400 font-medium">
              University Department Asset & Stock System
            </span>
          </div>
        </div>

        {/* Middle feature highlights */}
        <div className="relative z-10 space-y-8 my-auto max-w-lg">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-800/60 px-3.5 py-1 text-xs text-slate-300 backdrop-blur">
            <Sparkles className="size-3.5 text-amber-400" />
            <span>Campus Enterprise Resource Platform</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
              Intelligent Inventory & Requisition Management
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Streamline faculty requisitions, barcode-tracked asset allocations,
              central store ledgers, and department approval workflows with
              full audit accountability.
            </p>
          </div>

          {/* Quick value cards */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 backdrop-blur">
              <ClipboardCheck className="size-5 text-sky-400 mb-2" />
              <div className="text-xs font-semibold text-white">Multi-Tier</div>
              <div className="text-[11px] text-slate-400">Approval Chains</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 backdrop-blur">
              <QrCode className="size-5 text-indigo-400 mb-2" />
              <div className="text-xs font-semibold text-white">Asset Barcode</div>
              <div className="text-[11px] text-slate-400">Unit Lifecycle</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 backdrop-blur">
              <ShieldCheck className="size-5 text-emerald-400 mb-2" />
              <div className="text-xs font-semibold text-white">Full RBAC</div>
              <div className="text-[11px] text-slate-400">Audit Trail</div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-4">
          <span>Department of Computer Science & Engineering</span>
          <span>Internal Use Only</span>
        </div>
      </div>

      {/* RIGHT SIDE LOGIN FORM */}
      <div className="flex flex-col p-6 sm:p-10 md:p-14 items-center justify-center w-full bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile branding header */}
          <div className="flex lg:hidden items-center gap-2.5 justify-center mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow">
              <Boxes className="size-5" />
            </div>
            <div className="text-left">
              <span className="text-lg font-bold tracking-tight">UniInventory</span>
              <span className="block text-[11px] text-muted-foreground">Department Portal</span>
            </div>
          </div>

          <SectionHeader
            title="Sign In"
            description="Enter your institutional credentials to access your dashboard"
          />

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
