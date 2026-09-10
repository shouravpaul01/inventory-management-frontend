"use client";

import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, ShieldCheck, Building, Search, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useAppSelector } from "@/redux/hooks";
import { useGetUnreadCountQuery } from "@/redux/api/notificationsApi";

export function DashboardHeader() {
  const { user } = useAppSelector((state) => state.auth);
  const { data: unreadRes } = useGetUnreadCountQuery(undefined, {
    pollingInterval: 30000,
  });
  const unreadCount = unreadRes?.data?.count || 0;

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background/95 backdrop-blur-sm px-4 sticky top-0 z-30 transition-all">
      <div className="flex items-center gap-3 min-w-0">
        <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
        <Separator orientation="vertical" className="h-4" />

        {user?.department && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
            <Building className="size-3.5 text-primary/80 shrink-0" />
            <span className="font-semibold text-foreground truncate max-w-[200px] md:max-w-xs">
              {user.department.name}
            </span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-mono font-medium">
              {user.department.code}
            </Badge>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {user?.isSuperAdmin && (
          <Badge className="hidden md:inline-flex bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 text-[11px] font-semibold py-0.5 px-2">
            <ShieldCheck className="size-3" />
            Super Admin
          </Badge>
        )}

        {/* Global search trigger */}
        <Button
          variant="outline"
          size="sm"
          className="hidden md:flex items-center gap-3 text-xs text-muted-foreground h-8 px-3 rounded-lg border-dashed hover:border-primary/50"
          onClick={() => {
            const event = new KeyboardEvent("keydown", {
              key: "k",
              metaKey: true,
              bubbles: true,
            });
            document.dispatchEvent(event);
          }}
        >
          <Search className="size-3.5" />
          <span>Quick search inventory, units, records...</span>
          <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-1 rounded bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </Button>

        {/* Notifications shortcut */}
        <Button
          variant="ghost"
          size="icon-sm"
          asChild
          className="relative text-muted-foreground hover:text-foreground"
          title="Notifications"
        >
          <Link href="/notifications">
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 size-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
            <span className="sr-only">Notifications</span>
          </Link>
        </Button>

        <Separator orientation="vertical" className="h-4 mx-1" />

        {/* User quick badge */}
        <Link
          href="/profile"
          className="flex items-center gap-2 p-1 rounded-md hover:bg-muted/70 transition-colors"
          title="User Profile"
        >
          <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold border border-primary/20">
            {user?.firstName?.[0] || <UserIcon className="size-3.5" />}
          </div>
          <span className="hidden lg:inline text-xs font-medium text-foreground max-w-[120px] truncate">
            {user?.firstName}
          </span>
        </Link>
      </div>
    </header>
  );
}
