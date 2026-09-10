"use client";

import React, { ReactNode } from "react";
import { usePermission } from "@/lib/permissions";
import { Button } from "@/components/ui/button";

interface PermissionGateProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Conditionally renders children only if the user has the required permission(s).
 */
export function PermissionGate({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { can, canAny, canAll } = usePermission();

  let hasAccess = false;

  if (permission) {
    hasAccess = can(permission);
  } else if (permissions && permissions.length > 0) {
    hasAccess = requireAll ? canAll(permissions) : canAny(permissions);
  } else {
    hasAccess = true;
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface PermissionButtonProps extends React.ComponentProps<typeof Button> {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  hideIfForbidden?: boolean;
}

/**
 * A Button that respects user permissions. By default it is disabled with a helpful tooltip/title,
 * or it can be completely hidden when `hideIfForbidden` is true.
 */
export function PermissionButton({
  permission,
  permissions,
  requireAll = false,
  hideIfForbidden = false,
  disabled,
  children,
  ...props
}: PermissionButtonProps) {
  const { can, canAny, canAll } = usePermission();

  let hasAccess = false;

  if (permission) {
    hasAccess = can(permission);
  } else if (permissions && permissions.length > 0) {
    hasAccess = requireAll ? canAll(permissions) : canAny(permissions);
  } else {
    hasAccess = true;
  }

  if (!hasAccess && hideIfForbidden) {
    return null;
  }

  return (
    <Button
      {...props}
      disabled={disabled || !hasAccess}
      title={!hasAccess ? "You do not have permission to perform this action" : props.title}
    >
      {children}
    </Button>
  );
}

interface PermissionActionProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  hideIfForbidden?: boolean;
  children: ReactNode;
}

/**
 * Wrapper for dropdown action items or menu buttons that need permission-checking.
 */
export function PermissionAction({
  permission,
  permissions,
  requireAll = false,
  hideIfForbidden = true,
  children,
}: PermissionActionProps) {
  const { can, canAny, canAll } = usePermission();

  let hasAccess = false;

  if (permission) {
    hasAccess = can(permission);
  } else if (permissions && permissions.length > 0) {
    hasAccess = requireAll ? canAll(permissions) : canAny(permissions);
  } else {
    hasAccess = true;
  }

  if (!hasAccess) {
    if (hideIfForbidden) return null;
    return (
      <div className="opacity-50 pointer-events-none cursor-not-allowed" title="Permission denied">
        {children}
      </div>
    );
  }

  return <>{children}</>;
}
