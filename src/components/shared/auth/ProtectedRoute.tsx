"use client";

import React, { ReactNode, useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { usePermission } from "@/lib/permissions";
import { AccessDenied } from "./AccessDenied";
import Cookies from "js-cookie";
import { setUser } from "@/redux/features/authSlice";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  children: ReactNode;
}

const emptySubscribe = () => () => {};

export function ProtectedRoute({
  permission,
  permissions,
  requireAll = false,
  children,
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { token, user } = useAppSelector((state) => state.auth);
  const { can, canAny, canAll } = usePermission();

  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  useEffect(() => {
    if (!isMounted) return;
    const cookieToken = Cookies.get("accessToken");
    if (!token && cookieToken) {
      dispatch(setUser({ token: cookieToken }));
    }
  }, [isMounted, token, dispatch]);

  useEffect(() => {
    if (!isMounted) return;
    const cookieToken = Cookies.get("accessToken");
    if (!token && !cookieToken) {
      const redirectUrl = pathname ? `/login?redirect=${encodeURIComponent(pathname)}` : "/login";
      router.replace(redirectUrl);
    }
  }, [isMounted, token, pathname, router]);

  if (!isMounted) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          Loading departmental credentials...
        </p>
      </div>
    );
  }

  const hasToken = token || (typeof window !== "undefined" && Cookies.get("accessToken"));

  if (!hasToken) {
    return null;
  }

  if (!user) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          Synchronizing role permissions...
        </p>
      </div>
    );
  }

  // Check required permissions
  let hasAccess = false;
  if (permission) {
    hasAccess = can(permission);
  } else if (permissions && permissions.length > 0) {
    hasAccess = requireAll ? canAll(permissions) : canAny(permissions);
  } else {
    hasAccess = true;
  }

  if (!hasAccess) {
    return (
      <AccessDenied
        requiredPermission={permission}
        requiredPermissions={permissions}
      />
    );
  }

  return <>{children}</>;
}
