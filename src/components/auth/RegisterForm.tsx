"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RegisterForm() {
  return (
    <div className="text-center space-y-4">
      <p className="text-sm text-muted-foreground">
        Public registration is disabled. Please contact your departmental administrator for account provisioning.
      </p>
      <Button asChild>
        <Link href="/login">Return to Sign In</Link>
      </Button>
    </div>
  );
}
