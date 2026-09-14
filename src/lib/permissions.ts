import { TCurrentUser } from "@/type";

/**
 * Pure functions for role & permission evaluation.
 * Note: Super Admin automatically bypasses all permission checks.
 */

export const isSuperAdminUser = (user: TCurrentUser | null): boolean => {
  if (!user) return false;
  return Boolean(user.isSuperAdmin || user.roles?.includes("SUPER_ADMIN"));
};

export const hasPermission = (
  user: TCurrentUser | null,
  permission: string
): boolean => {
  if (!user) return false;
  if (isSuperAdminUser(user)) return true;
  return Array.isArray(user.permissions) && user.permissions.includes(permission);
};

export const hasAnyPermission = (
  user: TCurrentUser | null,
  permissions: string[]
): boolean => {
  if (!user) return false;
  if (isSuperAdminUser(user)) return true;
  if (!permissions || permissions.length === 0) return true;
  return (
    Array.isArray(user.permissions) &&
    permissions.some((p) => user.permissions.includes(p))
  );
};

export const hasAllPermissions = (
  user: TCurrentUser | null,
  permissions: string[]
): boolean => {
  if (!user) return false;
  if (isSuperAdminUser(user)) return true;
  if (!permissions || permissions.length === 0) return true;
  return (
    Array.isArray(user.permissions) &&
    permissions.every((p) => user.permissions.includes(p))
  );
};

export const hasRole = (user: TCurrentUser | null, role: string): boolean => {
  if (!user) return false;
  if (isSuperAdminUser(user)) return true;
  return Array.isArray(user.roles) && user.roles.includes(role);
};

export const hasAnyRole = (
  user: TCurrentUser | null,
  roles: string[]
): boolean => {
  if (!user) return false;
  if (isSuperAdminUser(user)) return true;
  if (!roles || roles.length === 0) return true;
  return Array.isArray(user.roles) && roles.some((r) => user.roles.includes(r));
};
