import { TPermission, TRole, TUser } from "@/type";

export type TOverrideState = "GRANT" | "REVOKE" | "DEFAULT";

export type TFilterTab =
  | "ALL"
  | "ACTIVE"
  | "INHERITED"
  | "OVERRIDES"
  | "GRANTS"
  | "REVOKES"
  | "NO_ACCESS";

export interface TEffectivePermissionState {
  isActive: boolean;
  type: "EXPLICIT_GRANT" | "EXPLICIT_REVOKE" | "INHERITED" | "NO_ACCESS";
  label: string;
  badgeClass: string;
  borderClass: string;
  inheritedRoles: string[];
}

export interface TAccessStats {
  explicitGrants: number;
  explicitRevokes: number;
  totalOverrides: number;
  roleInheritedCount: number;
  totalActive: number;
  noAccessCount: number;
  totalPermissions: number;
}

export interface UserAccessControlModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: TUser | null;
  initialTab?: "ROLES" | "OVERRIDES" | "MATRIX";
}
