"use client";

import { Bell, ChevronDown, KeyRound, LogOut, ShieldCheck, User } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAppDispatch } from "@/redux/hooks";
import { logout } from "@/redux/features/authSlice";
import { useLogoutApiMutation } from "@/redux/api/authApi";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

export default function DashboardHeader() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isSuperAdmin, department } = useCurrentUser();
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
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border/60 bg-background/95 px-4 backdrop-blur transition-[width,height] ease-linear">
      {/* Left section: Sidebar trigger + Department context */}
      <div className="flex items-center gap-2.5">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-4" />

        <div className="flex items-center gap-2">
          {department ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">
                {department.name}
              </span>
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-muted">
                {department.code}
              </span>
            </div>
          ) : isSuperAdmin ? (
            <Badge variant="secondary" className="text-xs font-normal gap-1">
              <ShieldCheck className="size-3 text-emerald-600" />
              Central Administration
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">
              Inventory Workspace
            </span>
          )}
        </div>
      </div>

      {/* Right section: Notifications + User Dropdown */}
      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        <Link href="/notifications">
          <Button
            variant="ghost"
            size="icon"
            className="relative size-9 text-muted-foreground hover:text-foreground"
            aria-label="View notifications"
          >
            <Bell className="size-4" />
          </Button>
        </Link>

        {/* User profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 h-9 px-2 hover:bg-muted/80 rounded-lg"
            >
              <Avatar className="size-7">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col text-left leading-none">
                <span className="text-xs font-semibold truncate max-w-[120px]">
                  {user?.firstName || user?.username || "User"}
                </span>
                <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                  {primaryRole}
                </span>
              </div>
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-xs font-semibold leading-none">
                  {user?.firstName} {user?.lastName || ""}
                </p>
                <p className="text-[11px] leading-none text-muted-foreground truncate">
                  {user?.email}
                </p>
                {user?.employeeId && (
                  <p className="text-[10px] font-mono text-muted-foreground">
                    ID: {user.employeeId}
                  </p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer flex items-center">
                <User className="mr-2 size-4" />
                <span>My Profile</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link href="/profile/password" className="cursor-pointer flex items-center">
                <KeyRound className="mr-2 size-4" />
                <span>Change Password</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <LogOut className="mr-2 size-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
