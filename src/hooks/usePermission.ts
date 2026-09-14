"use client";

import { useAppSelector } from "@/redux/hooks";
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole as checkRole,
  hasAnyRole as checkAnyRole,
  isSuperAdminUser,
} from "@/lib/permissions";

export const usePermission = () => {
  const user = useAppSelector((state) => state.auth.user);

  return {
    user,
    isSuperAdmin: isSuperAdminUser(user),
    can: (permission: string) => hasPermission(user, permission),
    canAny: (permissions: string[]) => hasAnyPermission(user, permissions),
    canAll: (permissions: string[]) => hasAllPermissions(user, permissions),
    hasRole: (role: string) => checkRole(user, role),
    hasAnyRole: (roles: string[]) => checkAnyRole(user, roles),
  };
};
