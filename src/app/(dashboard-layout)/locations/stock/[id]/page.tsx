"use client";

import React, { use } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Warehouse,
  Building2,
  Layers,
  DoorClosed,
  ArrowLeft,
  Boxes,
  QrCode,
  ImageIcon,
  ArrowRightLeft,
  Package,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetStockLocationByIdQuery } from "@/redux/api/locationsApi";
import { LocationType } from "@/types";

export default function StockLocationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const locationId = resolvedParams.id;

  const { data: locRes, isLoading } = useGetStockLocationByIdQuery(locationId);
  const loc = locRes?.data;

  const getTypeBadgeColor = (type?: LocationType) => {
    switch (type) {
      case "STORE":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300";
      case "ROOM":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300";
      case "RACK":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-300";
      case "SHELF":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300";
      case "CABINET":
        return "bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-300";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 md:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!loc) {
    return (
      <div className="p-6 text-center max-w-md mx-auto py-16">
        <Warehouse className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
        <h3 className="text-lg font-semibold">Storage Location Not Found</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          The requested storage location does not exist or has been deleted.
        </p>
        <Button asChild variant="outline">
          <Link href="/locations/stock">Back to Storage Units</Link>
        </Button>
      </div>
    );
  }

  const balances = (loc as any).stockBalances || [];
  const units = (loc as any).inventoryUnits || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title={loc.name}
        description={`Storage unit [${loc.code}] — ${loc.type} classification within ${loc.room?.name || "Campus space"}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Locations", href: "/locations/buildings" },
          { label: "Storage Units", href: "/locations/stock" },
          { label: loc.name },
        ]}
      >
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href="/locations/stock">
              <ArrowLeft className="w-4 h-4" />
              <span>All Locations</span>
            </Link>
          </Button>
          <Button asChild size="sm" className="gap-1.5">
            <Link href="/stock/balances">
              <ArrowRightLeft className="w-4 h-4" />
              <span>Transfer Stock</span>
            </Link>
          </Button>
        </div>
      </PageHeader>

      {/* Top Details Card & Image Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details & Hierarchy */}
        <Card className="lg:col-span-2 border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <code className="text-sm font-mono font-bold bg-muted px-2.5 py-1 rounded border">
                  {loc.code}
                </code>
                <Badge variant="outline" className={getTypeBadgeColor(loc.type)}>
                  {loc.type}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                Created: {new Date(loc.createdAt).toLocaleDateString()}
              </span>
            </div>
            <CardTitle className="text-xl font-bold mt-2">{loc.name}</CardTitle>
            <CardDescription>
              {loc.description || "No specialized storage handling or lock notes configured."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            {/* Spatial Location Hierarchy Path */}
            <div className="p-3.5 rounded-lg bg-muted/40 border space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Spatial Location Hierarchy
              </span>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="flex items-center gap-1 font-medium bg-background px-2.5 py-1 rounded border">
                  <Building2 className="w-3.5 h-3.5 text-primary" />
                  <span>{loc.room?.floor?.building?.name || "Campus Building"}</span>
                </div>
                <span className="text-muted-foreground">/</span>
                <div className="flex items-center gap-1 font-medium bg-background px-2.5 py-1 rounded border">
                  <Layers className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{loc.room?.floor?.name || "Floor Level"}</span>
                </div>
                <span className="text-muted-foreground">/</span>
                <div className="flex items-center gap-1 font-medium bg-background px-2.5 py-1 rounded border">
                  <DoorClosed className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{loc.room?.name || "Room"}</span>
                </div>
                <span className="text-muted-foreground">/</span>
                <div className="flex items-center gap-1 font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded border border-primary/20">
                  <Warehouse className="w-3.5 h-3.5" />
                  <span>{loc.name}</span>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="border rounded-lg p-3 bg-card">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">Bulk SKUs</span>
                  <Boxes className="w-4 h-4 text-primary" />
                </div>
                <div className="text-2xl font-bold mt-1">{balances.length}</div>
                <span className="text-[11px] text-muted-foreground">Item lines stored</span>
              </div>

              <div className="border rounded-lg p-3 bg-card">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">Serialized Assets</span>
                  <QrCode className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="text-2xl font-bold mt-1">{units.length}</div>
                <span className="text-[11px] text-muted-foreground">Units in this shelf</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right 1 Col: Visual Photo */}
        <Card className="border shadow-sm overflow-hidden flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Location Photo</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="relative h-48 w-full rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
              {loc.imageUrl ? (
                <Image
                  src={loc.imageUrl}
                  alt={loc.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground/50">
                  <ImageIcon className="w-10 h-10 mb-1" />
                  <span className="text-xs">No reference photo</span>
                </div>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 text-center">
              Visual reference for inventory technicians to find exact shelf.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Stored Inventory Content */}
      <Tabs defaultValue="balances" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
          <TabsTrigger value="balances" className="gap-1.5 text-xs">
            <Boxes className="w-3.5 h-3.5" />
            <span>Bulk Item Balances ({balances.length})</span>
          </TabsTrigger>
          <TabsTrigger value="units" className="gap-1.5 text-xs">
            <QrCode className="w-3.5 h-3.5" />
            <span>Serialized Units ({units.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Stock Balances */}
        <TabsContent value="balances" className="pt-4">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Stored Item Balances</CardTitle>
              <CardDescription className="text-xs">
                Bulk SKUs and catalog items currently stationed at this location.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {balances.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No items currently stored at this location.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-muted/40 text-muted-foreground border-b">
                      <tr>
                        <th className="px-6 py-3 font-medium">Item Name & SKU</th>
                        <th className="px-6 py-3 font-medium">Tracking</th>
                        <th className="px-6 py-3 font-medium text-right">Available</th>
                        <th className="px-6 py-3 font-medium text-right">Reserved</th>
                        <th className="px-6 py-3 font-medium text-right">Total On Hand</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {balances.map((sb: any) => (
                        <tr key={sb.id} className="hover:bg-muted/10 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-foreground">
                              {sb.inventoryItem?.name || "Inventory Item"}
                            </div>
                            <code className="text-xs font-mono text-muted-foreground">
                              {sb.inventoryItem?.sku || sb.inventoryItem?.code}
                            </code>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className="text-xs">
                              {sb.inventoryItem?.trackingType || "BULK"}
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
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Individual Serialized Units</CardTitle>
              <CardDescription className="text-xs">
                Specific tracked equipment with unique QR / asset serial codes located in this unit.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {units.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <QrCode className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No serialized individual units stationed here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-muted/40 text-muted-foreground border-b">
                      <tr>
                        <th className="px-6 py-3 font-medium">Asset / QR Code</th>
                        <th className="px-6 py-3 font-medium">Serial Number</th>
                        <th className="px-6 py-3 font-medium">Item Model</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                        <th className="px-6 py-3 font-medium">Physical Condition</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {units.map((unit: any) => (
                        <tr key={unit.id} className="hover:bg-muted/10 transition-colors">
                          <td className="px-6 py-4">
                            <code className="text-xs font-mono font-bold bg-muted px-2 py-0.5 rounded border text-foreground">
                              {unit.assetCode || unit.qrCode || unit.id}
                            </code>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                            {unit.serialNumber || "—"}
                          </td>
                          <td className="px-6 py-4 font-semibold text-foreground">
                            {unit.inventoryItem?.name || "Equipment Unit"}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={unit.status} />
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className="text-xs">
                              {unit.condition || "GOOD"}
                            </Badge>
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
