"use client";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePermission } from "@/hooks/usePermission";
import {
  Boxes,
  Package,
  FileText,
  SendHorizontal,
  RotateCcw,
  CheckSquare,
  ShieldCheck,
  Building2,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  QrCode,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useGetDashboardOverviewQuery,
  useGetLowStockReportQuery,
} from "@/redux/api/reportApi";
import { useGetStockMovementsQuery } from "@/redux/api/stockApi";

export default function DashboardPage() {
  const { user, isSuperAdmin, department } = useCurrentUser();
  const { can } = usePermission();

  const canViewReports = can("report.view");

  const { data: overviewData, isLoading: isOverviewLoading } =
    useGetDashboardOverviewQuery(undefined, { skip: !canViewReports });
  const overview = overviewData?.data;

  const { data: lowStockData } = useGetLowStockReportQuery(undefined, {
    skip: !canViewReports,
  });
  const lowStockItems = lowStockData?.data?.data || [];
  const lowStockAlerts = lowStockData?.data?.totalAlerts || 0;

  const { data: recentMovementsData } = useGetStockMovementsQuery(
    { limit: 5 },
    { skip: !can("inventory.view") }
  );
  const recentMovements = recentMovementsData?.data || [];

  const quickActions = [
    {
      title: "New Requisition",
      desc: "Submit request for office supplies or lab assets",
      href: "/requisitions",
      icon: <FileText className="size-5 text-blue-600" />,
      permission: "requisition.create",
    },
    {
      title: "Pending Approvals",
      desc: "Review requests awaiting institutional sign-off",
      href: "/approvals",
      icon: <CheckSquare className="size-5 text-amber-600" />,
      permission: "requisition.approve",
      count: overview?.requisitions?.pendingReview,
    },
    {
      title: "Stock Balances",
      desc: "Check real-time multi-location warehouse stocks",
      href: "/stock",
      icon: <Boxes className="size-5 text-emerald-600" />,
      permission: "stock.view",
    },
    {
      title: "Asset Units",
      desc: "Track serialized physical equipment and QR tags",
      href: "/inventory-units",
      icon: <QrCode className="size-5 text-indigo-600" />,
      permission: "inventory.view",
    },
    {
      title: "Active Distributions",
      desc: "Track dispatches, delivery challans, and gate passes",
      href: "/distributions",
      icon: <SendHorizontal className="size-5 text-purple-600" />,
      permission: "distribution.view",
    },
    {
      title: "Returns & Restocking",
      desc: "Manage equipment returns, repairs, and restock",
      href: "/returns",
      icon: <RotateCcw className="size-5 text-rose-600" />,
      permission: "return.view",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white shadow-sm border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-indigo-300">
                University Inventory & Asset Portal
              </span>
              {isSuperAdmin && (
                <Badge
                  variant="secondary"
                  className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[11px]"
                >
                  Super Admin
                </Badge>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Welcome back, {user?.firstName || "Faculty Member"}! 👋
            </h1>

            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              {department ? (
                <>
                  Assigned Department:{" "}
                  <span className="font-semibold text-white">{department.name}</span> (
                  {department.code})
                </>
              ) : (
                "Real-time institutional warehouse levels, multi-tier approvals, and asset lifecycles."
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {can("requisition.create") && (
              <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs shadow-xs">
                <Link href="/requisitions">
                  <FileText className="size-4 mr-1.5" />
                  New Requisition
                </Link>
              </Button>
            )}
            {canViewReports && (
              <Button
                asChild
                variant="outline"
                className="border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-white text-xs"
              >
                <Link href="/reports">
                  <BarChart3 className="size-4 mr-1.5" />
                  Reports & Analytics
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Key Executive Metrics */}
      {canViewReports && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 shadow-xs flex items-center gap-4">
            <div className="size-11 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 shrink-0">
              <Package className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Catalog Items</p>
              <p className="text-2xl font-bold text-foreground">
                {overview?.catalog?.totalItems ?? "—"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Across {overview?.catalog?.departments ?? 1} departments
              </p>
            </div>
          </Card>

          <Card className="p-4 shadow-xs flex items-center gap-4">
            <div className="size-11 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 shrink-0">
              <QrCode className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Serialized Assets</p>
              <p className="text-2xl font-bold text-foreground">
                {overview?.serializedAssets?.total ?? "—"}
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                {overview?.serializedAssets?.inStock ?? 0} In Stock • {overview?.serializedAssets?.issued ?? 0} Issued
              </p>
            </div>
          </Card>

          <Card className="p-4 shadow-xs flex items-center gap-4">
            <div className="size-11 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 shrink-0">
              <Boxes className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Consumables Stock</p>
              <p className="text-2xl font-bold text-foreground">
                {overview?.bulkStock?.availableQuantity ?? "—"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {overview?.bulkStock?.reservedQuantity ?? 0} Reserved for Requisitions
              </p>
            </div>
          </Card>

          <Card className="p-4 shadow-xs flex items-center gap-4">
            <div className="size-11 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 shrink-0">
              <CheckSquare className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Approvals Pending</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {overview?.requisitions?.pendingReview ?? "0"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {overview?.requisitions?.approvedPendingIssue ?? 0} Approved ready to issue
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Critical Low Stock Alert Banner (If Any) */}
      {canViewReports && lowStockAlerts > 0 && (
        <div className="rounded-xl border border-amber-300/80 bg-amber-50/70 dark:bg-amber-950/30 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-800 dark:text-amber-300">
            <AlertTriangle className="size-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-bold text-sm">
                Low Stock Threshold Alert ({lowStockAlerts} items below reorder level)
              </p>
              <p className="text-amber-700 dark:text-amber-400 text-xs">
                Certain critical consumables and laboratory supplies are at or below safety stock.
              </p>
            </div>
          </div>
          <Button asChild size="sm" variant="outline" className="border-amber-400 text-amber-900 dark:text-amber-200 hover:bg-amber-100 text-xs shrink-0">
            <Link href="/reports">View Reorder Report</Link>
          </Button>
        </div>
      )}

      {/* Quick Access Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Core Workflows & Actions
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {quickActions
            .filter((action) => !action.permission || can(action.permission))
            .map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="group relative flex items-start gap-3.5 rounded-xl border border-border/60 bg-card p-4 shadow-xs transition-all hover:border-border hover:shadow-sm hover:bg-accent/30"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted group-hover:bg-background transition-colors">
                  {action.icon}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {action.title}
                    </span>
                    {action.count !== undefined && action.count > 0 && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                        {action.count}
                      </Badge>
                    )}
                    <ArrowRight className="size-3.5 text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all ml-1" />
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    {action.desc}
                  </p>
                </div>
              </Link>
            ))}
        </div>
      </div>

      {/* Recent Movements Ledger Widget */}
      {recentMovements.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Recent Inventory Movements
            </h2>
            <Link href="/stock/ledger" className="text-xs text-primary hover:underline font-medium">
              View All Movements &rarr;
            </Link>
          </div>

          <div className="rounded-xl border bg-card shadow-xs divide-y divide-border/40 overflow-hidden">
            {recentMovements.map((m) => (
              <div
                key={m.id}
                className="p-3.5 text-xs flex items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-foreground">
                    {m.movementNumber}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {m.type}
                  </Badge>
                  <span className="font-medium text-foreground">
                    {m.inventoryItem?.name || "Item"}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-muted-foreground">
                  <span className="font-bold text-foreground">
                    {m.quantity} {m.inventoryItem?.unitName || "pcs"}
                  </span>
                  <span className="text-[11px] whitespace-nowrap">
                    {new Date(m.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Status / Security Notice */}
      <div className="rounded-xl border border-border/60 bg-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
          <span>Session active with institutional access control, immutable audit logging & RBAC.</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span>User: {user?.username}</span>
          <span>•</span>
          <span>Role: {user?.roles?.[0] || "Staff"}</span>
        </div>
      </div>
    </div>
  );
}
