"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function RegisterForm() {
  return (
    <div className="space-y-6 text-center">
      <div className="rounded-xl border border-border/80 bg-muted/40 p-6 space-y-3">
        <ShieldAlert className="size-10 text-amber-500 mx-auto" />
        <h3 className="text-base font-semibold text-foreground">
          Self-Registration Closed
        </h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
          Faculty, department heads, and storekeepers are provisioned directly by
          University Department Administrators. Please contact your administrator to
          obtain portal credentials.
        </p>
      </div>

      <Button asChild className="w-full h-11">
        <Link href="/login" className="flex items-center justify-center gap-2">
          <ArrowLeft className="size-4" />
          Return to Sign In
        </Link>
      </Button>
    </div>
  );
}
