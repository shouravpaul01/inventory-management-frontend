"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
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

function normalizePath(p: string): string {
  if (!p) return "";
  const cleaned = p.replace(/\/+$/, "");
  return cleaned === "" ? "/" : cleaned;
}

function NavCollapsibleItem({
  item,
  isUrlActive,
  activeClass,
}: {
  item: NavItem;
  isUrlActive: (url?: string) => boolean;
  activeClass: string;
}) {
  const hasActiveChild = item.items?.some((sub) => isUrlActive(sub.url));
  const isDirectActive = isUrlActive(item.url);
  const isParentActive = isDirectActive || Boolean(hasActiveChild);

  const [isOpen, setIsOpen] = React.useState(isParentActive);

  React.useEffect(() => {
    if (isParentActive) {
      setIsOpen(true);
    }
  }, [isParentActive]);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={item.title}
            isActive={isParentActive}
            className={cn(
              isParentActive && !hasActiveChild && "bg-muted/70 font-medium"
            )}
          >
            {item.icon}
            <span>{item.title}</span>

            <ChevronRightIcon className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 text-muted-foreground" />
          </SidebarMenuButton>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <SidebarMenuSub>
            {item.items?.map((subItem) => {
              const isSubActive = isUrlActive(subItem.url);

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
}

export function NavMain({
  items,
  groupLabel,
  allNavItems,
}: {
  items: NavItem[];
  groupLabel?: string;
  allNavItems?: NavItem[];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { can, canAny } = usePermission();

  const activeClass =
    "bg-primary! text-primary-foreground! font-medium hover:bg-primary hover:text-primary-foreground";

  const hasPermission = React.useCallback(
    (item: { permission?: string; permissions?: string[] }) => {
      if (item.permission && !can(item.permission)) {
        return false;
      }
      if (item.permissions && !canAny(item.permissions)) {
        return false;
      }
      return true;
    },
    [can, canAny]
  );

  // Filter items based on user permissions
  const filteredItems = React.useMemo(() => {
    return items
      .map((item) => {
        if (!hasPermission(item)) {
          return null;
        }

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
  }, [items, hasPermission, can]);

  // Collect candidate URLs from allNavItems (if provided) or current items to find best matching route
  const candidateUrls = React.useMemo(() => {
    const sourceList = allNavItems || items;
    const urls: string[] = [];

    const addUrl = (url?: string) => {
      if (url && url !== "#") {
        urls.push(url);
      }
    };

    sourceList.forEach((item) => {
      if (!hasPermission(item)) return;

      addUrl(item.url);
      if (item.items?.length) {
        item.items.forEach((sub) => {
          if (!sub.permission || can(sub.permission)) {
            addUrl(sub.url);
          }
        });
      }
    });

    return urls;
  }, [allNavItems, items, hasPermission, can]);

  // Score how well a URL matches the current route
  const getScore = React.useCallback(
    (targetUrl?: string) => {
      if (!targetUrl || targetUrl === "#") return -1;

      const [rawTarget, targetQuery] = targetUrl.split("?");
      const currentPath = normalizePath(pathname || "");
      const targetPath = normalizePath(rawTarget);

      const isExact = currentPath === targetPath;
      const isSub =
        targetPath !== "/" && currentPath.startsWith(`${targetPath}/`);

      if (!isExact && !isSub) return -1;

      if (targetQuery) {
        const params = new URLSearchParams(targetQuery);
        let match = true;
        params.forEach((val, key) => {
          if (searchParams?.get(key) !== val) {
            match = false;
          }
        });
        if (!match) return -1;
        return (isExact ? targetPath.length * 100 : targetPath.length * 10) + 10000;
      }

      return isExact ? targetPath.length * 100 : targetPath.length * 10;
    },
    [pathname, searchParams]
  );

  // Highest score among all candidate URLs
  const bestScore = React.useMemo(() => {
    let max = -1;
    for (const url of candidateUrls) {
      const score = getScore(url);
      if (score > max) {
        max = score;
      }
    }
    return max;
  }, [candidateUrls, getScore]);

  // A URL is active only if it is the best match
  const isUrlActive = React.useCallback(
    (url?: string) => {
      if (!url || url === "#" || bestScore <= 0) return false;
      const score = getScore(url);
      return score > 0 && score === bestScore;
    },
    [bestScore, getScore]
  );

  if (filteredItems.length === 0) {
    return null;
  }

  return (
    <SidebarGroup>
      {groupLabel && <SidebarGroupLabel>{groupLabel}</SidebarGroupLabel>}

      <SidebarMenu>
        {filteredItems.map((item) => {
          const hasChildren = !!item.items?.length;

          if (hasChildren) {
            return (
              <NavCollapsibleItem
                key={item.title}
                item={item}
                isUrlActive={isUrlActive}
                activeClass={activeClass}
              />
            );
          }

          const isItemActive = isUrlActive(item.url);

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={isItemActive}
                className={cn(isItemActive && activeClass, "h-10")}
              >
                <Link href={item.url}>
                  {item.icon}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
