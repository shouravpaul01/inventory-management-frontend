"use client";

import { useAppSelector } from "@/redux/hooks";
import { isSuperAdminUser } from "@/lib/permissions";
import { TCurrentUser, TDepartment } from "@/type";

export interface CurrentUserHookReturn {
  user: TCurrentUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  roles: string[];
  permissions: string[];
  department: TDepartment | null;
}

export const useCurrentUser = (): CurrentUserHookReturn => {
  const { user, token } = useAppSelector((state) => state.auth);

  return {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    isSuperAdmin: isSuperAdminUser(user),
    roles: user?.roles || [],
    permissions: user?.permissions || [],
    department: user?.department || null,
  };
};
