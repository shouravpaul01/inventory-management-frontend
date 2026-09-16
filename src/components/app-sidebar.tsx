"use client";

import * as React from "react";
import { NavMain, NavItem } from "@/components/nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Package,
  QrCode,
  Boxes,
  History,
  FileText,
  CheckSquare,
  SendHorizontal,
  RotateCcw,
  Layers,
  MapPin,
  Building2,
  Users,
  Shield,
  ScrollText,
  BarChart3,
  LogOut,
  User,
  SlidersHorizontal,
} from "lucide-react";
import Logo from "./shared/Logo";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/redux/hooks";
import { logout } from "@/redux/features/authSlice";
import { useLogoutApiMutation } from "@/redux/api/authApi";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const overviewNav: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: <LayoutDashboard className="size-4" />,
  },
];

const inventoryNav: NavItem[] = [
  {
    title: "Item Catalog",
    url: "/inventory",
    icon: <Package className="size-4" />,
    permission: "inventory.view",
  },
  {
    title: "Asset Units",
    url: "/inventory-units",
    icon: <QrCode className="size-4" />,
    permission: "inventory.view",
  },
  {
    title: "Stock Balances",
    url: "/stock",
    icon: <Boxes className="size-4" />,
    permission: "inventory.view",
  },
  {
    title: "Stock Ledger",
    url: "/stock/ledger",
    icon: <History className="size-4" />,
    permission: "inventory.view",
  },
];

const workflowNav: NavItem[] = [
  {
    title: "Requisitions",
    url: "/requisitions",
    icon: <FileText className="size-4" />,
    permission: "requisition.view",
  },
  {
    title: "Approvals",
    url: "/approvals",
    icon: <CheckSquare className="size-4" />,
    permissions: [
      "requisition.approve",
      "approval.view",
      "approval.manage_policy",
      "requisition.view",
      "requisition.create",
    ],
  },
  {
    title: "Distributions",
    url: "/distributions",
    icon: <SendHorizontal className="size-4" />,
    permission: "distribution.view",
  },
  {
    title: "Returns",
    url: "/returns",
    icon: <RotateCcw className="size-4" />,
    permission: "return.view",
  },
];

const organizationNav: NavItem[] = [
  {
    title: "Categories",
    url: "/categories",
    icon: <Layers className="size-4" />,
    permission: "category.view",
  },
  {
    title: "Locations & Stores",
    url: "/locations",
    icon: <MapPin className="size-4" />,
    permission: "location.view",
  },
  {
    title: "Departments",
    url: "/departments",
    icon: <Building2 className="size-4" />,
    permission: "department.view",
  },
];

const administrationNav: NavItem[] = [
  {
    title: "User Management",
    url: "/users",
    icon: <Users className="size-4" />,
    permission: "user.view",
  },
  {
    title: "Roles & RBAC",
    url: "/roles",
    icon: <Shield className="size-4" />,
    permission: "role.view",
  },
  {
    title: "Approval Policies & Exemptions",
    url: "/approvals?tab=policies",
    icon: <SlidersHorizontal className="size-4" />,
    permissions: ["approval.manage_policy", "SUPER_ADMIN"],
  },
  {
    title: "Audit Trail",
    url: "/audit-logs",
    icon: <ScrollText className="size-4" />,
    permission: "audit.view",
  },
  {
    title: "Reports & Assets",
    url: "/reports",
    icon: <BarChart3 className="size-4" />,
    permissions: ["report.view", "inventory.view"],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isSuperAdmin } = useCurrentUser();
  const [logoutApi] = useLogoutApiMutation();

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap().catch(() => {});
    } finally {
      dispatch(logout());
      toast.success("Logged out successfully 👋");
      router.push("/login");
    }
  };

  const userInitials =
    user?.firstName && user?.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      : user?.username?.slice(0, 2).toUpperCase() || "U";

  const primaryRole = isSuperAdmin
    ? "Super Admin"
    : user?.roles?.[0] || "Staff";

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-border/40 p-2">
        <Logo href="/dashboard" />
      </SidebarHeader>

      <SidebarContent className="gap-0 py-2">
        <NavMain items={overviewNav} groupLabel="Overview" />
        <NavMain items={inventoryNav} groupLabel="Inventory & Stock" />
        <NavMain items={workflowNav} groupLabel="Workflows & Requests" />
        <NavMain items={organizationNav} groupLabel="Organization" />
        <NavMain items={administrationNav} groupLabel="Administration" />
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 p-3 space-y-2">
        {/* User Mini Card */}
        {user && (
          <div className="flex items-center gap-2.5 rounded-lg bg-muted/60 p-2 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center">
            <Avatar className="size-8 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden text-left leading-tight group-data-[collapsible=icon]:hidden">
              <span className="text-xs font-semibold truncate text-foreground">
                {user.firstName} {user.lastName || ""}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge
                  variant="outline"
                  className="text-[10px] px-1 py-0 h-4 font-normal text-muted-foreground"
                >
                  {primaryRole}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full flex items-center justify-center gap-2 text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive h-9"
          onClick={handleLogout}
        >
          <LogOut className="size-4 shrink-0" />
          <span className="group-data-[collapsible=icon]:hidden">Sign Out</span>
        </Button>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
