"use client";

import { ReactNode } from "react";
import { usePermission } from "@/hooks/usePermission";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PermissionGuardProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  children: ReactNode;
  fallback?: ReactNode;
}

export default function PermissionGuard({
  permission,
  permissions,
  requireAll = false,
  children,
  fallback,
}: PermissionGuardProps) {
  const { can, canAny, canAll, isSuperAdmin } = usePermission();

  if (isSuperAdmin) {
    return <>{children}</>;
  }

  let hasAccess = true;

  if (permission) {
    hasAccess = can(permission);
  } else if (permissions && permissions.length > 0) {
    hasAccess = requireAll ? canAll(permissions) : canAny(permissions);
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="min-h-[55vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
      <div className="size-16 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 shadow-xs">
        <ShieldAlert className="size-8" />
      </div>
      <h2 className="text-xl font-bold tracking-tight text-foreground">
        Access Restricted
      </h2>
      <p className="text-sm text-muted-foreground max-w-md mt-2 mb-6 leading-relaxed">
        You do not have the required institutional permission (
        <code className="text-xs font-mono text-rose-600 dark:text-rose-400 font-semibold">
          {permission || permissions?.join(", ")}
        </code>
        ) to view this module. Please contact your system administrator if you believe this is an error.
      </p>
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" className="gap-2">
          <Link href="/dashboard">
            <ArrowLeft className="size-4" />
            Back to Dashboard
          </Link>
        </Button>
        <Button asChild className="gap-2">
          <Link href="/requisitions">
            View My Requisitions
          </Link>
        </Button>
      </div>
    </div>
  );
}
