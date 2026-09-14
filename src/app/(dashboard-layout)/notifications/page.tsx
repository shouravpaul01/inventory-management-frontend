"use client";

import { useState } from "react";
import {
  Bell,
  CheckCheck,
  Check,
  FileText,
  SendHorizontal,
  RotateCcw,
  Boxes,
  AlertTriangle,
  Info,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import SectionHeader from "@/components/shared/SectionHeader";
import Pagination from "@/components/shared/Pagination";
import {
  useGetMyNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
} from "@/redux/api/notificationApi";
import { TNotification, TNotificationType } from "@/type";
import Link from "next/link";
import { toast } from "sonner";

export default function NotificationsPage() {
  const [filterType, setFilterType] = useState<TNotificationType | "">("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data, isLoading } = useGetMyNotificationsQuery({
    type: (filterType as TNotificationType) || undefined,
    isRead: unreadOnly ? false : undefined,
    page,
    limit,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const [markAsRead, { isLoading: isMarkingSingle }] =
    useMarkNotificationAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAll }] =
    useMarkAllNotificationsAsReadMutation();

  const notifications = data?.data || [];
  const meta = data?.meta || {
    page: 1,
    limit: 10,
    total: 0,
    totalPage: 1,
  };

  const getNotificationIcon = (type: TNotificationType) => {
    switch (type) {
      case "REQUISITION":
        return <FileText className="size-4 text-primary" />;
      case "APPROVAL":
        return <CheckCircle2 className="size-4 text-emerald-600" />;
      case "DISTRIBUTION":
      case "DELIVERY":
        return <SendHorizontal className="size-4 text-sky-600" />;
      case "RETURN":
        return <RotateCcw className="size-4 text-amber-600" />;
      case "STOCK":
        return <Boxes className="size-4 text-indigo-600" />;
      case "ALERT":
      case "WARNING":
      case "DANGER":
        return <AlertTriangle className="size-4 text-rose-600" />;
      default:
        return <Info className="size-4 text-muted-foreground" />;
    }
  };

  const handleMarkSingle = async (id: string) => {
    try {
      await markAsRead(id).unwrap();
      toast.success("Notification marked as read.");
    } catch {
      toast.error("Failed to mark notification as read.");
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllAsRead().unwrap();
      toast.success("All notifications marked as read.");
    } catch {
      toast.error("Failed to mark all notifications as read.");
    }
  };

  const getEntityUrl = (notif: TNotification) => {
    if (notif.link) return notif.link;
    if (notif.referenceType === "Requisition") return "/requisitions";
    if (notif.referenceType === "ApprovalRequest") return "/approvals";
    if (notif.referenceType === "Distribution") return "/distributions";
    if (notif.referenceType === "ReturnTransaction") return "/returns";
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <SectionHeader
          title="Notifications Center"
          description="Real-time alerts, approval status updates, material requests, and inventory events."
        />

        <Button
          variant="outline"
          size="sm"
          onClick={handleMarkAll}
          disabled={isMarkingAll}
          className="gap-1.5 text-xs shadow-xs"
        >
          <CheckCheck className="size-4" />
          Mark All As Read
        </Button>
      </div>

      {/* Filter Tabs / Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={!unreadOnly ? "default" : "outline"}
            onClick={() => {
              setUnreadOnly(false);
              setPage(1);
            }}
            className="text-xs h-8"
          >
            All Notifications
          </Button>

          <Button
            size="sm"
            variant={unreadOnly ? "default" : "outline"}
            onClick={() => {
              setUnreadOnly(true);
              setPage(1);
            }}
            className="text-xs h-8"
          >
            Unread Only
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value as TNotificationType | "");
              setPage(1);
            }}
            aria-label="Filter by notification type"
            className="h-8 px-2.5 text-xs rounded-md border border-input bg-background focus:outline-hidden focus:ring-1 focus:ring-ring"
          >
            <option value="">All Categories</option>
            <option value="REQUISITION">Requisitions</option>
            <option value="APPROVAL">Approvals</option>
            <option value="DISTRIBUTION">Distributions</option>
            <option value="RETURN">Returns</option>
            <option value="STOCK">Stock Alerts</option>
            <option value="SYSTEM">System Notices</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-xl border bg-card p-12 text-center space-y-2">
            <Bell className="size-10 text-muted-foreground/50 mx-auto" />
            <p className="font-semibold text-sm text-foreground">No notifications found</p>
            <p className="text-xs text-muted-foreground">
              {unreadOnly
                ? "You have no unread notifications right now."
                : "When activities take place on your requisitions or assigned reviews, you'll see them here."}
            </p>
          </div>
        ) : (
          notifications.map((notif) => {
            const entityUrl = getEntityUrl(notif);

            return (
              <Card
                key={notif.id}
                className={`p-4 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs ${
                  !notif.isRead
                    ? "border-primary/40 bg-primary/5 dark:bg-primary/10"
                    : "bg-card"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="size-9 rounded-lg bg-muted/80 flex items-center justify-center shrink-0 mt-0.5">
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-sm ${
                          !notif.isRead
                            ? "font-bold text-foreground"
                            : "font-semibold text-foreground/90"
                        }`}
                      >
                        {notif.title}
                      </p>
                      <Badge variant="outline" className="text-[10px]">
                        {notif.type}
                      </Badge>
                      {!notif.isRead && (
                        <span className="size-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                      {notif.message}
                    </p>

                    <p className="text-[11px] text-muted-foreground/70 font-mono pt-1">
                      {new Date(notif.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {entityUrl && (
                    <Link href={entityUrl}>
                      <Button variant="ghost" size="sm" className="gap-1 text-xs h-8">
                        <ExternalLink className="size-3.5" />
                        View
                      </Button>
                    </Link>
                  )}

                  {!notif.isRead && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkSingle(notif.id)}
                      className="gap-1 text-xs h-8"
                    >
                      <Check className="size-3.5" />
                      Mark Read
                    </Button>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {!isLoading && notifications.length > 0 && (
        <Pagination
          currentPage={page}
          totalPages={meta.totalPage || 1}
          totalData={meta.total || 0}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      )}
    </div>
  );
}
