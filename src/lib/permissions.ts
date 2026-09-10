import { IAuthUser } from "@/types";
import { useAppSelector } from "@/redux/hooks";

/**
 * Checks if a user has a specific permission.
 * Super Admins automatically have all permissions.
 */
export const hasPermission = (
  user: IAuthUser | null | undefined,
  permissionCode?: string | null
): boolean => {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  if (!permissionCode) return true;

  const permissions = user.permissions || [];
  return permissions.includes(permissionCode) || permissions.includes("*");
};

/**
 * Checks if a user has ANY of the specified permissions.
 */
export const hasAnyPermission = (
  user: IAuthUser | null | undefined,
  permissionCodes: string[]
): boolean => {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  if (!permissionCodes || permissionCodes.length === 0) return true;

  const permissions = user.permissions || [];
  if (permissions.includes("*")) return true;

  return permissionCodes.some((code) => permissions.includes(code));
};

/**
 * Checks if a user has ALL of the specified permissions.
 */
export const hasAllPermissions = (
  user: IAuthUser | null | undefined,
  permissionCodes: string[]
): boolean => {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  if (!permissionCodes || permissionCodes.length === 0) return true;

  const permissions = user.permissions || [];
  if (permissions.includes("*")) return true;

  return permissionCodes.every((code) => permissions.includes(code));
};

/**
 * Custom React Hook for permission evaluation in components.
 */
export const usePermission = () => {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  return {
    user,
    isAuthenticated,
    isSuperAdmin: Boolean(user?.isSuperAdmin),
    can: (permissionCode?: string | null) => hasPermission(user, permissionCode),
    canAny: (permissionCodes: string[]) => hasAnyPermission(user, permissionCodes),
    canAll: (permissionCodes: string[]) => hasAllPermissions(user, permissionCodes),
  };
};
