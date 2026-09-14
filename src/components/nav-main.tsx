"use client";

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
import { usePermission } from "@/hooks/usePermission";

export type NavItem = {
  title: string;
  url: string;
  icon?: React.ReactNode;
  permission?: string;
  permissions?: string[];
  items?: {
    title: string;
    url: string;
    permission?: string;
  }[];
};

export function NavMain({
  items,
  groupLabel,
}: {
  items: NavItem[];
  groupLabel?: string;
}) {
  const pathname = usePathname();
  const { can, canAny } = usePermission();

  const activeClass =
    "bg-primary text-primary-foreground font-medium hover:bg-primary hover:text-primary-foreground";

  // Filter items based on user permissions
  const filteredItems = items
    .map((item) => {
      // Direct permission check for parent
      if (item.permission && !can(item.permission)) {
        return null;
      }
      if (item.permissions && !canAny(item.permissions)) {
        return null;
      }

      // Check children permissions
      if (item.items && item.items.length > 0) {
        const visibleSubItems = item.items.filter(
          (sub) => !sub.permission || can(sub.permission)
        );

        if (visibleSubItems.length === 0 && item.url === "#") {
          return null;
        }

        return {
          ...item,
          items: visibleSubItems,
        };
      }

      return item;
    })
    .filter(Boolean) as NavItem[];

  if (filteredItems.length === 0) {
    return null;
  }

  return (
    <SidebarGroup>
      {groupLabel && <SidebarGroupLabel>{groupLabel}</SidebarGroupLabel>}

      <SidebarMenu>
        {filteredItems.map((item) => {
          const hasChildren = !!item.items?.length;

          const isParentActive =
            pathname === item.url ||
            (item.url !== "#" && pathname.startsWith(`${item.url}/`)) ||
            item.items?.some(
              (subItem) =>
                pathname === subItem.url ||
                pathname.startsWith(`${subItem.url}/`)
            );

          // Menu item without children
          if (!hasChildren) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isParentActive}
                  className={cn(isParentActive && activeClass)}
                >
                  <Link href={item.url}>
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          // Collapsible menu item with children
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
                    className={cn(isParentActive && !item.items?.some(sub => pathname === sub.url) && "bg-muted/70 font-medium")}
                  >
                    {item.icon}
                    <span>{item.title}</span>

                    <ChevronRightIcon className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 text-muted-foreground" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => {
                      const isSubActive =
                        pathname === subItem.url ||
                        pathname.startsWith(`${subItem.url}/`);

                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isSubActive}
                            className={cn(isSubActive && activeClass)}
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
}