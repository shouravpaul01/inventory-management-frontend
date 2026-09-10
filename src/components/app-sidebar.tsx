"use client";

import * as React from "react";
import { NavMain, NavGroup } from "@/components/nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  KeyRound,
  Sliders,
  Building,
  Building2,
  Layers,
  DoorClosed,
  Tag,
  Warehouse,
  Package,
  FolderTree,
  QrCode,
  ScanLine,
  Boxes,
  History,
  Hash,
  ClipboardList,
  Truck,
  RotateCcw,
  CheckSquare,
  Bell,
  ShieldAlert,
  BarChart3,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import Logo from "./shared/Logo";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { logout } from "@/redux/features/authSlice";
import { useLogoutApiMutation } from "@/redux/api/authApi";
import { toast } from "sonner";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navigationGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: <LayoutDashboard className="size-4" />,
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        title: "Requisitions",
        url: "/requisitions",
        icon: <ClipboardList className="size-4" />,
        permission: "requisition.view",
      },
      {
        title: "Distributions",
        url: "/distributions",
        icon: <Truck className="size-4" />,
        permission: "distribution.view",
      },
      {
        title: "Returns",
        url: "/returns",
        icon: <RotateCcw className="size-4" />,
        permission: "return.view",
      },
    ],
  },
  {
    label: "Inventory Management",
    items: [
      {
        title: "Inventory Catalog",
        url: "/inventory",
        icon: <Package className="size-4" />,
        permission: "inventory.view",
      },
      {
        title: "Categories",
        url: "/categories",
        icon: <FolderTree className="size-4" />,
        permission: "category.view",
      },
      {
        title: "Serialized Units",
        url: "/inventory-units",
        icon: <QrCode className="size-4" />,
        permission: "inventory_unit.view",
      },
      {
        title: "Scan & Lookup",
        url: "/inventory-units/lookup",
        icon: <ScanLine className="size-4" />,
        permission: "inventory_unit.qr_lookup",
      },
      {
        title: "Stock Balances",
        url: "/stock/balances",
        icon: <Boxes className="size-4" />,
        permission: "stock.view",
      },
      {
        title: "Movement Ledger",
        url: "/inventory/movements",
        icon: <History className="size-4" />,
        permission: "stock.view",
      },
      {
        title: "Code Sequences",
        url: "/inventory/code-sequences",
        icon: <Hash className="size-4" />,
        permission: "code_sequence.view",
      },
    ],
  },
  {
    label: "Locations",
    items: [
      {
        title: "Storage Locations",
        url: "/locations/stock",
        icon: <Warehouse className="size-4" />,
        permission: "location.view",
      },
      {
        title: "Rooms",
        url: "/locations/rooms",
        icon: <DoorClosed className="size-4" />,
        permission: "location.view",
      },
      {
        title: "Floors",
        url: "/locations/floors",
        icon: <Layers className="size-4" />,
        permission: "location.view",
      },
      {
        title: "Buildings",
        url: "/locations/buildings",
        icon: <Building2 className="size-4" />,
        permission: "location.view",
      },
      {
        title: "Room Types",
        url: "/locations/room-types",
        icon: <Tag className="size-4" />,
        permission: "location.view",
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        title: "Users",
        url: "/users",
        icon: <Users className="size-4" />,
        permission: "user.view",
      },
      {
        title: "Departments",
        url: "/departments",
        icon: <Building className="size-4" />,
        permission: "department.view",
      },
      {
        title: "Roles",
        url: "/roles",
        icon: <ShieldCheck className="size-4" />,
        permission: "role.view",
      },
      {
        title: "Permissions",
        url: "/permissions",
        icon: <KeyRound className="size-4" />,
        permission: "role.view",
      },
      {
        title: "Approval Policies",
        url: "/approvals/policies",
        icon: <Sliders className="size-4" />,
        permission: "approval.manage_policy",
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        title: "Approval Center",
        url: "/approvals",
        icon: <CheckSquare className="size-4" />,
        permission: "approval.view",
      },
      {
        title: "Notifications",
        url: "/notifications",
        icon: <Bell className="size-4" />,
        permission: "notification.view",
      },
      {
        title: "Audit Logs",
        url: "/audit-logs",
        icon: <ShieldAlert className="size-4" />,
        permission: "audit.view",
      },
      {
        title: "Reports & Analytics",
        url: "/reports",
        icon: <BarChart3 className="size-4" />,
        permission: "report.view",
      },
    ],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [logoutApi] = useLogoutApiMutation();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
    } catch {
      // ignore api logout error
    } finally {
      dispatch(logout());
      toast.success("Signed out successfully 👋");
      router.replace("/login");
    }
  };

  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "U"
    : "U";

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b px-4 py-3">
        <Logo />
      </SidebarHeader>

      <SidebarContent className="px-2">
        <NavMain groups={navigationGroups} />
      </SidebarContent>

      <SidebarFooter className="border-t p-3 space-y-2">
        {user && (
          <Link
            href="/profile"
            className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/70 transition-colors group"
          >
            <Avatar className="size-8 rounded-md shrink-0">
              <AvatarFallback className="rounded-md bg-primary text-primary-foreground text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold text-foreground truncate group-hover:text-primary">
                {user.firstName} {user.lastName}
              </span>
              <span className="text-[10px] text-muted-foreground truncate">
                {user.employeeId || user.email}
              </span>
            </div>
            <UserIcon className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full flex items-center justify-center gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive text-xs h-9"
          onClick={handleLogout}
        >
          <LogOut className="size-3.5" />
          <span>Sign Out</span>
        </Button>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
