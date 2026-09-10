"use client";

import React, { useState } from "react";
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  Inbox,
  RefreshCw,
  AlertTriangle,
  ClipboardList,
  Truck,
  RotateCcw,
  Package,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetMyNotificationsQuery,
  useMarkAllAsReadMutation,
  useMarkAsReadMutation,
} from "@/redux/api/notificationsApi";
import { INotification } from "@/types";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

const typeIcons: Record<string, React.ReactNode> = {
  SYSTEM: <Bell className="size-4 text-blue-500" />,
  APPROVAL: <CheckCircle2 className="size-4 text-purple-500" />,
  REQUISITION: <ClipboardList className="size-4 text-amber-500" />,
  DISTRIBUTION: <Truck className="size-4 text-emerald-500" />,
  RETURN: <RotateCcw className="size-4 text-indigo-500" />,
  DELIVERY: <Truck className="size-4 text-blue-500" />,
  STOCK: <Package className="size-4 text-amber-600" />,
  ALERT: <AlertTriangle className="size-4 text-rose-500" />,
};

export default function NotificationsPage() {
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const { data: notifRes, isLoading, isFetching, refetch } = useGetMyNotificationsQuery(undefined, {
    pollingInterval: 30000,
  });
  const [markAsRead, { isLoading: isMarkingSingle }] = useMarkAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAll }] = useMarkAllAsReadMutation();

  const notifications: INotification[] = notifRes?.data || [];

  const filteredNotifications = notifications.filter((item) => {
    if (selectedType === "ALL") return true;
    if (selectedType === "UNREAD") return !item.isRead;
    return item.type === selectedType;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAll = async () => {
    try {
      await markAllAsRead().unwrap();
      toast.success("All notifications marked as read.");
    } catch {
      toast.error("Failed to mark notifications as read.");
    }
  };

  const handleMarkSingle = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markAsRead(id).unwrap();
    } catch {
      toast.error("Failed to update notification.");
    }
  };

  const getTargetUrl = (notif: INotification): string | null => {
    if (notif.linkUrl) return notif.linkUrl;
    if (!notif.entityType || !notif.entityId) return null;

    switch (notif.entityType) {
      case "REQUISITION":
        return `/requisitions/${notif.entityId}`;
      case "DISTRIBUTION":
        return `/distributions/${notif.entityId}`;
      case "RETURN":
        return `/returns/${notif.entityId}`;
      case "APPROVAL":
        return `/approvals/${notif.entityId}`;
      case "INVENTORY_ITEM":
        return `/inventory/${notif.entityId}`;
      case "INVENTORY_UNIT":
        return `/inventory-units/${notif.entityId}`;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Department Notifications"
        description="Review real-time system alerts, approval requirements, distribution confirmations, and inventory warnings."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Notifications" },
        ]}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-9 gap-1.5 text-xs"
          >
            <RefreshCw className={cn("size-3.5", isFetching && "animate-spin")} />
            <span>Refresh</span>
          </Button>

          {unreadCount > 0 && (
            <Button
              variant="default"
              size="sm"
              onClick={handleMarkAll}
              disabled={isMarkingAll}
              className="h-9 gap-1.5 text-xs font-medium"
            >
              <CheckCheck className="size-3.5" />
              <span>Mark All as Read ({unreadCount})</span>
            </Button>
          )}
        </div>
      </PageHeader>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b pb-3 text-xs">
        <span className="text-muted-foreground mr-1 flex items-center gap-1">
          <Filter className="size-3" /> Filter:
        </span>
        {["ALL", "UNREAD", "APPROVAL", "REQUISITION", "DISTRIBUTION", "RETURN", "STOCK", "ALERT"].map(
          (type) => (
            <Button
              key={type}
              variant={selectedType === type ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType(type)}
              className="h-7 text-xs rounded-full px-3"
            >
              {type === "ALL"
                ? `All (${notifications.length})`
                : type === "UNREAD"
                ? `Unread (${unreadCount})`
                : type.toLowerCase()}
            </Button>
          )
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4 shadow-2xs">
              <div className="flex items-start gap-3">
                <Skeleton className="size-8 rounded-full shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            </Card>
          ))
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border bg-card/60">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
              <Inbox className="size-6" />
            </div>
            <h3 className="font-semibold text-sm text-foreground">No notifications found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              {selectedType === "UNREAD"
                ? "You have caught up with all department updates! No unread notifications remain."
                : "No persistent alerts or records match the selected filter category."}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const targetUrl = getTargetUrl(notif);

            return (
              <Card
                key={notif.id}
                className={cn(
                  "transition-all hover:border-primary/40 shadow-2xs border",
                  !notif.isRead && "border-l-4 border-l-primary bg-primary/5 dark:bg-primary/10"
                )}
              >
                <CardContent className="p-4 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div className="size-8 rounded-full bg-background border flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      {typeIcons[notif.type] || <Bell className="size-4 text-muted-foreground" />}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-xs text-foreground">
                          {notif.title}
                        </span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 uppercase font-mono">
                          {notif.type}
                        </Badge>
                        {!notif.isRead && (
                          <span className="size-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {notif.message}
                      </p>

                      <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {new Date(notif.createdAt).toLocaleString()}
                        </span>

                        {targetUrl && (
                          <Link
                            href={targetUrl}
                            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                          >
                            <span>View details</span>
                            <ExternalLink className="size-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  {!notif.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleMarkSingle(notif.id, e)}
                      disabled={isMarkingSingle}
                      className="text-xs h-7 text-muted-foreground hover:text-foreground shrink-0"
                    >
                      Mark read
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
