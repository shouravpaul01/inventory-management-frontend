"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePermission } from "@/lib/permissions";

interface AccessDeniedProps {
  requiredPermission?: string;
  requiredPermissions?: string[];
  message?: string;
}

export function AccessDenied({
  requiredPermission,
  requiredPermissions,
  message,
}: AccessDeniedProps) {
  const { user } = usePermission();

  const perms = requiredPermission
    ? [requiredPermission]
    : requiredPermissions || [];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="size-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-6 ring-8 ring-destructive/5 animate-in zoom-in-75 duration-300">
        <ShieldAlert className="size-8" />
      </div>

      <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Access Restricted
      </h2>

      <p className="mt-2 text-sm text-muted-foreground max-w-md">
        {message ||
          "You do not possess the required departmental permissions to view or perform operations on this resource."}
      </p>

      {perms.length > 0 && (
        <div className="mt-4 p-3 bg-muted/60 border rounded-lg max-w-md w-full text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Required permission(s):</span>{" "}
          <span className="font-mono text-destructive">{perms.join(", ")}</span>
        </div>
      )}

      {user && (
        <div className="mt-2 text-xs text-muted-foreground">
          Logged in as <span className="font-medium text-foreground">{user.email}</span> (
          {user.roles.join(", ") || "Standard User"})
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3 justify-center">
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft className="size-4 mr-2" />
          Go Back
        </Button>
        <Button asChild>
          <Link href="/dashboard">
            <Home className="size-4 mr-2" />
            Return to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
