"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermission } from "@/lib/permissions";

export type NavSubItem = {
  title: string;
  url: string;
  permission?: string;
};

export type NavItem = {
  title: string;
  url: string;
  icon?: React.ReactNode;
  permission?: string;
  permissions?: string[];
  items?: NavSubItem[];
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export function NavMain({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();
  const { can, canAny } = usePermission();

  const activeClass =
    "bg-primary text-primary-foreground font-semibold shadow-xs hover:bg-primary/95 hover:text-primary-foreground";

  return (
    <>
      {groups.map((group) => {
        // Filter items in this group based on permissions
        const visibleItems = group.items.filter((item) => {
          if (item.permission) {
            return can(item.permission);
          }
          if (item.permissions && item.permissions.length > 0) {
            return canAny(item.permissions);
          }
          // If item has sub-items, show parent if user can access at least one sub-item
          if (item.items && item.items.length > 0) {
            return item.items.some((sub) => !sub.permission || can(sub.permission));
          }
          return true;
        });

        if (visibleItems.length === 0) {
          return null;
        }

        return (
          <SidebarGroup key={group.label} className="py-1">
            <SidebarGroupLabel className="text-[11px] font-semibold tracking-wider text-muted-foreground/80 uppercase">
              {group.label}
            </SidebarGroupLabel>

            <SidebarMenu>
              {visibleItems.map((item) => {
                // Filter visible sub-items
                const visibleSubItems = item.items?.filter(
                  (sub) => !sub.permission || can(sub.permission)
                );

                const hasChildren = !!visibleSubItems && visibleSubItems.length > 0;

                const isParentActive =
                  pathname === item.url ||
                  pathname.startsWith(`${item.url}/`) ||
                  visibleSubItems?.some(
                    (subItem) =>
                      pathname === subItem.url ||
                      pathname.startsWith(`${subItem.url}/`)
                  );

                // Menu without children
                if (!hasChildren) {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.title}
                        isActive={isParentActive}
                        className={cn(
                          "transition-colors text-sm font-medium",
                          isParentActive && activeClass
                        )}
                      >
                        <Link href={item.url}>
                          {item.icon}
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                // Menu with children
                return (
                  <Collapsible
                    key={item.title}
                    defaultOpen={isParentActive}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={item.title}
                          isActive={isParentActive}
                          className={cn(
                            "transition-colors text-sm font-medium",
                            isParentActive && activeClass
                          )}
                        >
                          {item.icon}
                          <span>{item.title}</span>
                          <ChevronRightIcon className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <SidebarMenuSub className="my-1">
                          {visibleSubItems?.map((subItem) => {
                            const isSubActive =
                              pathname === subItem.url ||
                              pathname.startsWith(`${subItem.url}/`);

                            return (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={isSubActive}
                                  className={cn(
                                    "transition-colors text-xs font-medium",
                                    isSubActive && activeClass
                                  )}
                                >
                                  <Link href={subItem.url}>
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        );
      })}
    </>
  );
}