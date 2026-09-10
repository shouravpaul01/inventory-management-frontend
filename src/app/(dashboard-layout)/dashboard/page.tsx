"use client";

import React from "react";
import Link from "next/link";
import {
  Package,
  QrCode,
  Boxes,
  ClipboardList,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  ArrowUpRight,
  Plus,
  ScanLine,
  Building,
  Truck,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { PermissionGate } from "@/components/shared/permissions/PermissionGate";
import {
  useGetDashboardOverviewQuery,
  useGetLowStockReportQuery,
  useGetOverdueReturnsReportQuery,
} from "@/redux/api/reportsApi";
import { useAppSelector } from "@/redux/hooks";

export default function DashboardPage() {
  const { user } = useAppSelector((state) => state.auth);

  const { data: overviewRes, isLoading: isOverviewLoading } = useGetDashboardOverviewQuery();
  const { data: lowStockRes, isLoading: isLowStockLoading } = useGetLowStockReportQuery();
  const { data: overdueRes, isLoading: isOverdueLoading } = useGetOverdueReturnsReportQuery();

  const overview = overviewRes?.data;
  const lowStock = lowStockRes?.data;
  const overdue = overdueRes?.data;

  return (
    <div className="space-y-6">
      {/* Top Banner / Page Header */}
      <PageHeader
        title={`Welcome back, ${user?.firstName || "Faculty"}! 👋`}
        description={`Operational overview for ${user?.department?.name || "Academic Department"} (${user?.department?.code || "DEPT"}). All asset tracking, authorizations, and stock movements are synchronized in real-time.`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <PermissionGate permission="inventory_unit.qr_lookup">
            <Button variant="outline" size="sm" asChild className="h-9 gap-1.5 text-xs">
              <Link href="/inventory-units/lookup">
                <ScanLine className="size-3.5" />
                <span>Scan QR Code</span>
              </Link>
            </Button>
          </PermissionGate>

          <PermissionGate permission="requisition.create">
            <Button size="sm" asChild className="h-9 gap-1.5 text-xs font-semibold">
              <Link href="/requisitions/create">
                <Plus className="size-3.5" />
                <span>New Requisition</span>
              </Link>
            </Button>
          </PermissionGate>
        </div>
      </PageHeader>

      {/* KPI Metric Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Catalog Items */}
        <Card className="shadow-2xs border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Catalog Items
            </CardTitle>
            <div className="size-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Package className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isOverviewLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="space-y-1">
                <div className="text-2xl font-bold tracking-tight text-foreground">
                  {overview?.catalog?.totalItems ?? 0}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Across {overview?.catalog?.departments ?? 1} department catalog(s)
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Serialized Units In Stock */}
        <Card className="shadow-2xs border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Serialized Units
            </CardTitle>
            <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <QrCode className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isOverviewLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight text-foreground">
                    {overview?.serializedAssets?.inStock ?? 0}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    / {overview?.serializedAssets?.total ?? 0} total
                  </span>
                </div>
                <div className="flex gap-2 text-[11px] text-muted-foreground">
                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                    {overview?.serializedAssets?.issued ?? 0} issued
                  </span>
                  <span>•</span>
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    {(overview?.serializedAssets?.damaged ?? 0) +
                      (overview?.serializedAssets?.maintenance ?? 0)}{" "}
                    maintenance
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bulk Stock */}
        <Card className="shadow-2xs border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Bulk Stock Quantity
            </CardTitle>
            <div className="size-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Boxes className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isOverviewLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="space-y-1">
                <div className="text-2xl font-bold tracking-tight text-foreground">
                  {overview?.bulkStock?.availableQuantity ?? 0}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {overview?.bulkStock?.reservedQuantity ?? 0} reserved •{" "}
                  {overview?.bulkStock?.totalQuantity ?? 0} total units
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Requisitions Pending */}
        <Card className="shadow-2xs border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Pending Requisitions
            </CardTitle>
            <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <ClipboardList className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isOverviewLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="space-y-1">
                <div className="text-2xl font-bold tracking-tight text-foreground">
                  {overview?.requisitions?.pendingReview ?? 0}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {overview?.requisitions?.approvedPendingIssue ?? 0} approved awaiting distribution
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alert Cards Banner */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Low Stock Warning Box */}
        <Card className="border-amber-500/30 bg-amber-500/5 shadow-2xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
                <CardTitle className="text-sm font-semibold text-foreground">
                  Low Stock & Reorder Monitor
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 font-semibold">
                {isLowStockLoading ? "..." : `${lowStock?.totalAlerts ?? 0} Alerts`}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Inventory items whose currently available quantity has reached or fallen below reorder thresholds.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLowStockLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : !lowStock || lowStock.data.length === 0 ? (
              <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <span>All tracked inventory items currently satisfy required stock thresholds.</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {lowStock.data.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border bg-background/80 text-xs gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-foreground truncate">{item.name}</div>
                      <div className="text-[11px] text-muted-foreground flex gap-2 font-mono">
                        <span>{item.code}</span>
                        <span>•</span>
                        <span>{item.categoryName || "General"}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-destructive">
                        {item.currentStock} / {item.reorderLevel} {item.unitName}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Deficit: {item.deficit} {item.unitName}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="pt-1 flex justify-end">
              <Button variant="ghost" size="sm" asChild className="text-xs h-8 gap-1 text-primary">
                <Link href="/stock/balances">
                  <span>View Full Stock Balances</span>
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Overdue Returns Alert Box */}
        <Card className="border-rose-500/30 bg-rose-500/5 shadow-2xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="size-4 text-rose-600 dark:text-rose-400" />
                <CardTitle className="text-sm font-semibold text-foreground">
                  Overdue Return Tracking
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-xs bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30 font-semibold">
                {isOverdueLoading ? "..." : `${overdue?.totalOverdue ?? 0} Overdue`}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Temporary distributions whose expected return dates have lapsed without recorded check-in.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isOverdueLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : !overdue || overdue.data.length === 0 ? (
              <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <span>No outstanding temporary loans are overdue for return.</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {overdue.data.slice(0, 4).map((dist) => (
                  <div
                    key={dist.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border bg-background/80 text-xs gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-foreground truncate">
                        {dist.receiver?.firstName} {dist.receiver?.lastName}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {dist.receiver?.employeeId} • {dist.lines.length} item line(s)
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant="outline" className="bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30 text-[10px] font-mono">
                        Due: {new Date(dist.expectedReturnAt).toLocaleDateString()}
                      </Badge>
                      <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                        {dist.code}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="pt-1 flex justify-end">
              <Button variant="ghost" size="sm" asChild className="text-xs h-8 gap-1 text-primary">
                <Link href="/returns">
                  <span>Process Returns</span>
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation / Action Hub */}
      <Card className="shadow-2xs border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground">
            Department Operations & Action Center
          </CardTitle>
          <CardDescription className="text-xs">
            Direct shortcuts to key departmental asset operations and workflows.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            <Link
              href="/requisitions"
              className="flex flex-col items-center justify-center p-3 rounded-xl border bg-muted/20 hover:bg-muted/50 hover:border-primary/40 transition-all text-center group"
            >
              <ClipboardList className="size-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-foreground">Requisitions</span>
              <span className="text-[10px] text-muted-foreground">Request items</span>
            </Link>

            <Link
              href="/distributions"
              className="flex flex-col items-center justify-center p-3 rounded-xl border bg-muted/20 hover:bg-muted/50 hover:border-primary/40 transition-all text-center group"
            >
              <Truck className="size-6 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-foreground">Distributions</span>
              <span className="text-[10px] text-muted-foreground">Issue & handover</span>
            </Link>

            <Link
              href="/returns"
              className="flex flex-col items-center justify-center p-3 rounded-xl border bg-muted/20 hover:bg-muted/50 hover:border-primary/40 transition-all text-center group"
            >
              <RotateCcw className="size-6 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-foreground">Returns</span>
              <span className="text-[10px] text-muted-foreground">Receive items</span>
            </Link>

            <Link
              href="/inventory"
              className="flex flex-col items-center justify-center p-3 rounded-xl border bg-muted/20 hover:bg-muted/50 hover:border-primary/40 transition-all text-center group"
            >
              <Package className="size-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-foreground">Catalog</span>
              <span className="text-[10px] text-muted-foreground">Master items</span>
            </Link>

            <Link
              href="/inventory-units"
              className="flex flex-col items-center justify-center p-3 rounded-xl border bg-muted/20 hover:bg-muted/50 hover:border-primary/40 transition-all text-center group"
            >
              <QrCode className="size-6 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-foreground">Serialized Units</span>
              <span className="text-[10px] text-muted-foreground">Physical items</span>
            </Link>

            <Link
              href="/locations/stock"
              className="flex flex-col items-center justify-center p-3 rounded-xl border bg-muted/20 hover:bg-muted/50 hover:border-primary/40 transition-all text-center group"
            >
              <Building className="size-6 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-foreground">Storage Locations</span>
              <span className="text-[10px] text-muted-foreground">Rooms & racks</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
