"use client";

import React, { use } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Package,
  QrCode,
  ArrowLeft,
  Warehouse,
  History,
  RotateCcw,
  ImageIcon,
  Plus,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetInventoryItemByIdQuery } from "@/redux/api/inventoryApi";
import { useGetAllInventoryUnitsQuery } from "@/redux/api/inventoryUnitsApi";

export default function InventoryItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const itemId = resolvedParams.id;

  const { data: itemRes, isLoading: isItemLoading } = useGetInventoryItemByIdQuery(itemId);
  const { data: unitsRes, isLoading: isUnitsLoading } = useGetAllInventoryUnitsQuery({
    inventoryItemId: itemId,
  });

  const item = itemRes?.data;
  const units = unitsRes?.data || [];

  if (isItemLoading) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="p-6 text-center max-w-md mx-auto py-16">
        <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
        <h3 className="text-lg font-semibold">Inventory Item Not Found</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          The requested catalog item does not exist or has been removed.
        </p>
        <Button asChild variant="outline">
          <Link href="/inventory">Back to Catalog</Link>
        </Button>
      </div>
    );
  }

  const stockBalances = (item as any).stockBalances || [];
  const stats = item.unitStats || {
    total: units.length,
    inStock: units.filter((u) => u.status === "IN_STOCK").length,
    reserved: units.filter((u) => u.status === "RESERVED").length,
    issued: units.filter((u) => u.status === "ISSUED").length,
    damaged: units.filter((u) => u.status === "DAMAGED").length,
    lost: units.filter((u) => u.status === "LOST").length,
  };

  const totalBulkQty = stockBalances.reduce(
    (sum: number, sb: any) => sum + (sb.quantity || 0),
    0
  );
  const availableBulkQty = stockBalances.reduce(
    (sum: number, sb: any) => sum + (sb.availableQuantity ?? sb.quantity ?? 0),
    0
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title={item.name}
        description={`${item.code} • SKU: ${item.sku || "N/A"} • Category: ${item.category?.name || "General"}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Inventory", href: "/inventory" },
          { label: item.name },
        ]}
      >
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href="/inventory">
              <ArrowLeft className="w-4 h-4" />
              <span>Catalog</span>
            </Link>
          </Button>

          {item.trackingType === "SERIALIZED" && (
            <Button asChild size="sm" className="gap-1.5">
              <Link href={`/inventory-units?itemId=${item.id}`}>
                <QrCode className="w-4 h-4" />
                <span>Manage Serialized Units</span>
              </Link>
            </Button>
          )}

          <Button asChild variant="secondary" size="sm" className="gap-1.5">
            <Link href={`/inventory/movements?itemId=${item.id}`}>
              <History className="w-4 h-4" />
              <span>Stock Ledger</span>
            </Link>
          </Button>
        </div>
      </PageHeader>

      {/* Main Info Card and Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details */}
        <Card className="lg:col-span-2 border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono font-bold bg-muted px-2.5 py-1 rounded border text-foreground">
                  {item.code}
                </code>
                <Badge
                  variant="outline"
                  className={
                    item.trackingType === "SERIALIZED"
                      ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300"
                  }
                >
                  {item.trackingType === "SERIALIZED" ? "SERIALIZED ASSET" : "BULK QUANTITY SKU"}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {item.defaultIssuePolicy}
                </Badge>
              </div>

              {item.isReturnable && (
                <Badge variant="outline" className="text-emerald-700 dark:text-emerald-300 border-emerald-300 gap-1 text-xs">
                  <RotateCcw className="w-3 h-3" /> Returnable
                </Badge>
              )}
            </div>

            <CardTitle className="text-xl font-bold mt-3 text-foreground">
              {item.name}
            </CardTitle>
            <CardDescription className="text-xs">
              {[item.brand && `Brand: ${item.brand}`, item.model && `Model: ${item.model}`]
                .filter(Boolean)
                .join(" • ") || "No specific brand/model specified."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            {item.description && (
              <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-lg border">
                {item.description}
              </p>
            )}

            {/* Thresholds & Stock Config */}
            <div className="grid grid-cols-3 gap-3">
              <div className="border rounded-lg p-3 bg-card">
                <span className="text-[11px] text-muted-foreground font-medium">Unit of Measure</span>
                <div className="text-base font-bold text-foreground mt-0.5">{item.unitName || "Piece"}</div>
              </div>

              <div className="border rounded-lg p-3 bg-card">
                <span className="text-[11px] text-muted-foreground font-medium">Minimum Stock</span>
                <div className="text-base font-bold text-foreground mt-0.5">{item.minimumStock || 0}</div>
              </div>

              <div className="border rounded-lg p-3 bg-card">
                <span className="text-[11px] text-muted-foreground font-medium">Reorder Threshold</span>
                <div className="text-base font-bold text-foreground mt-0.5">{item.reorderLevel || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right 1 Col: Photo */}
        <Card className="border shadow-sm overflow-hidden flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Product Photo</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="relative h-48 w-full rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground/50">
                  <ImageIcon className="w-10 h-10 mb-1" />
                  <span className="text-xs">No catalog photo</span>
                </div>
              )}
            </div>
            <div className="text-[11px] text-muted-foreground text-center mt-2 font-mono">
              SKU: {item.sku || "Not specified"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI Overview by Tracking Type */}
      {item.trackingType === "SERIALIZED" ? (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Card className="border shadow-sm p-4">
            <span className="text-xs text-muted-foreground font-medium">Total Registered</span>
            <div className="text-2xl font-bold mt-1 text-foreground">{stats.total || 0}</div>
            <span className="text-[10px] text-muted-foreground">Unique asset tags</span>
          </Card>

          <Card className="border shadow-sm p-4">
            <span className="text-xs text-emerald-600 font-medium">In Stock (Available)</span>
            <div className="text-2xl font-bold mt-1 text-emerald-600">{stats.inStock || 0}</div>
            <span className="text-[10px] text-muted-foreground">Ready for issue</span>
          </Card>

          <Card className="border shadow-sm p-4">
            <span className="text-xs text-amber-600 font-medium">Reserved</span>
            <div className="text-2xl font-bold mt-1 text-amber-600">{stats.reserved || 0}</div>
            <span className="text-[10px] text-muted-foreground">Pending requisition</span>
          </Card>

          <Card className="border shadow-sm p-4">
            <span className="text-xs text-blue-600 font-medium">Issued (In Custody)</span>
            <div className="text-2xl font-bold mt-1 text-blue-600">{stats.issued || 0}</div>
            <span className="text-[10px] text-muted-foreground">Held by staff/students</span>
          </Card>

          <Card className="border shadow-sm p-4">
            <span className="text-xs text-rose-600 font-medium">Damaged / Lost</span>
            <div className="text-2xl font-bold mt-1 text-rose-600">
              {(stats.damaged || 0) + (stats.lost || 0)}
            </div>
            <span className="text-[10px] text-muted-foreground">Unusable assets</span>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border shadow-sm p-4">
            <span className="text-xs text-muted-foreground font-medium">Total On-Hand Bulk Stock</span>
            <div className="text-2xl font-bold mt-1 text-foreground">{totalBulkQty} {item.unitName}</div>
            <span className="text-[10px] text-muted-foreground">Across all storage shelves</span>
          </Card>

          <Card className="border shadow-sm p-4">
            <span className="text-xs text-emerald-600 font-medium">Available for Requisition</span>
            <div className="text-2xl font-bold mt-1 text-emerald-600">{availableBulkQty} {item.unitName}</div>
            <span className="text-[10px] text-muted-foreground">Unreserved inventory</span>
          </Card>

          <Card className="border shadow-sm p-4">
            <span className="text-xs text-muted-foreground font-medium">Storage Location Count</span>
            <div className="text-2xl font-bold mt-1 text-primary">{stockBalances.length}</div>
            <span className="text-[10px] text-muted-foreground">Racks / bins holding this SKU</span>
          </Card>
        </div>
      )}

      {/* Tabs: Location Balances vs Serialized Units */}
      <Tabs defaultValue={item.trackingType === "SERIALIZED" ? "units" : "locations"} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
          <TabsTrigger value="locations" className="text-xs gap-1.5">
            <Warehouse className="w-3.5 h-3.5" />
            <span>Storage Locations ({stockBalances.length})</span>
          </TabsTrigger>
          <TabsTrigger value="units" className="text-xs gap-1.5" disabled={item.trackingType !== "SERIALIZED"}>
            <QrCode className="w-3.5 h-3.5" />
            <span>Serialized Units ({units.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Storage Location Balances */}
        <TabsContent value="locations" className="pt-4">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Storage Location Balances</CardTitle>
              <CardDescription className="text-xs">
                Physical shelves, racks, and stores where this item is positioned.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {stockBalances.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Warehouse className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No storage location balances recorded yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-muted/40 text-muted-foreground border-b">
                      <tr>
                        <th className="px-6 py-3 font-medium">Storage Unit</th>
                        <th className="px-6 py-3 font-medium">Unit Type</th>
                        <th className="px-6 py-3 font-medium text-right">Available</th>
                        <th className="px-6 py-3 font-medium text-right">Reserved</th>
                        <th className="px-6 py-3 font-medium text-right">Total On Hand</th>
                        <th className="px-6 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {stockBalances.map((sb: any) => (
                        <tr key={sb.id} className="hover:bg-muted/10 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-foreground">
                              {sb.location?.name || "Storage Unit"}
                            </div>
                            <code className="text-xs font-mono text-muted-foreground">
                              {sb.location?.code}
                            </code>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className="text-xs">
                              {sb.location?.type || "LOCATION"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-emerald-600">
                            {sb.availableQuantity ?? sb.quantity ?? 0}
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-amber-600">
                            {sb.reservedQuantity || 0}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-foreground">
                            {sb.quantity || 0}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                              <Link href={`/locations/stock/${sb.locationId}`}>
                                View Shelf
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Serialized Units */}
        <TabsContent value="units" className="pt-4">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Individual Serialized Equipment</CardTitle>
                <CardDescription className="text-xs">
                  Physical devices tagged with QR / barcode asset identifiers.
                </CardDescription>
              </div>
              <Button asChild size="sm" className="gap-1.5 text-xs">
                <Link href={`/inventory-units?itemId=${item.id}`}>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Batch Generate Units</span>
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {isUnitsLoading ? (
                <div className="p-6 space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : units.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <QrCode className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No serialized units generated yet for this item.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-muted/40 text-muted-foreground border-b">
                      <tr>
                        <th className="px-6 py-3 font-medium">Asset / QR Tag</th>
                        <th className="px-6 py-3 font-medium">Serial Number</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                        <th className="px-6 py-3 font-medium">Condition</th>
                        <th className="px-6 py-3 font-medium">Current Location</th>
                        <th className="px-6 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {units.map((unit) => (
                        <tr key={unit.id} className="hover:bg-muted/10 transition-colors">
                          <td className="px-6 py-4">
                            <code className="text-xs font-mono font-bold bg-muted px-2 py-0.5 rounded border text-foreground">
                              {unit.uniqueCode || unit.barcode || unit.id}
                            </code>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                            {unit.serialNumber || "—"}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={unit.status} />
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className="text-xs">
                              {unit.condition || "GOOD"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-xs text-muted-foreground">
                            {unit.currentLocation?.name || "Central Store"}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                              <Link href={`/inventory-units/${unit.id}`}>
                                Details & QR
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
