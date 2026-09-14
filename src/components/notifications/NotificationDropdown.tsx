"use client";

import {
  Bell,
  CheckCheck,
  FileText,
  SendHorizontal,
  RotateCcw,
  Boxes,
  AlertTriangle,
  Info,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useGetMyNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
} from "@/redux/api/notificationApi";
import { TNotification, TNotificationType } from "@/type";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotificationDropdown() {
  const router = useRouter();
  const { data: countData } = useGetUnreadNotificationCountQuery(undefined, {
    pollingInterval: 30000,
  });
  const unreadCount = countData?.data?.unreadCount || 0;

  const { data: notifData } = useGetMyNotificationsQuery({ limit: 5 });
  const recentNotifications = notifData?.data || [];

  const [markAsRead] = useMarkNotificationAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAll }] =
    useMarkAllNotificationsAsReadMutation();

  const getNotificationIcon = (type: TNotificationType) => {
    switch (type) {
      case "REQUISITION":
        return <FileText className="size-3.5 text-primary" />;
      case "APPROVAL":
        return <CheckCircle2 className="size-3.5 text-emerald-600" />;
      case "DISTRIBUTION":
      case "DELIVERY":
        return <SendHorizontal className="size-3.5 text-sky-600" />;
      case "RETURN":
        return <RotateCcw className="size-3.5 text-amber-600" />;
      case "STOCK":
        return <Boxes className="size-3.5 text-indigo-600" />;
      case "ALERT":
      case "WARNING":
      case "DANGER":
        return <AlertTriangle className="size-3.5 text-rose-600" />;
      default:
        return <Info className="size-3.5 text-muted-foreground" />;
    }
  };

  const handleNotificationClick = async (notif: TNotification) => {
    if (!notif.isRead) {
      await markAsRead(notif.id).unwrap().catch(() => {});
    }

    if (notif.link) {
      router.push(notif.link);
    } else if (notif.referenceType === "Requisition") {
      router.push("/requisitions");
    } else if (notif.referenceType === "ApprovalRequest") {
      router.push("/approvals");
    } else if (notif.referenceType === "Distribution") {
      router.push("/distributions");
    } else if (notif.referenceType === "ReturnTransaction") {
      router.push("/returns");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-9 text-muted-foreground hover:text-foreground"
          aria-label="View notifications"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold leading-none animate-in zoom-in-50">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0 shadow-lg">
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-xs text-foreground">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                {unreadCount} new
              </Badge>
            )}
          </div>

          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => markAllAsRead().unwrap().catch(() => {})}
              disabled={isMarkingAll}
              className="text-[11px] text-muted-foreground hover:text-primary gap-1 h-6 px-1.5"
            >
              <CheckCheck className="size-3" />
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-border/40">
          {recentNotifications.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No recent notifications.
            </div>
          ) : (
            recentNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3 text-xs flex items-start gap-2.5 cursor-pointer hover:bg-muted/40 transition-colors ${
                  !notif.isRead ? "bg-primary/5 dark:bg-primary/10" : ""
                }`}
              >
                <div className="size-7 rounded-md bg-muted/60 flex items-center justify-center shrink-0 mt-0.5">
                  {getNotificationIcon(notif.type)}
                </div>

                <div className="flex-1 space-y-0.5 overflow-hidden">
                  <div className="flex items-center justify-between gap-1">
                    <p
                      className={`truncate text-xs ${
                        !notif.isRead
                          ? "font-semibold text-foreground"
                          : "font-medium text-foreground/80"
                      }`}
                    >
                      {notif.title}
                    </p>
                    {!notif.isRead && (
                      <span className="size-1.5 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    {notif.message}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 pt-0.5">
                    {new Date(notif.createdAt).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-2 border-t text-center bg-muted/20">
          <Link href="/notifications" className="block text-xs font-medium text-primary hover:underline py-1">
            View All Notifications
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
