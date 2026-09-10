"use client";

import React, { use } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  QrCode,
  ArrowLeft,
  Printer,
  Warehouse,
  ShieldCheck,
  Copy,
  Check,
  Calendar,
  DoorClosed,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetInventoryUnitByIdQuery } from "@/redux/api/inventoryUnitsApi";
import { toast } from "sonner";

export default function InventoryUnitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const unitId = resolvedParams.id;

  const { data: unitRes, isLoading } = useGetInventoryUnitByIdQuery(unitId);
  const unit = unitRes?.data;

  const [isCopied, setIsCopied] = React.useState(false);

  const qrData = unit?.qrValue || unit?.uniqueCode || unit?.id || "";
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    qrData
  )}`;

  const handleCopyCode = () => {
    if (!qrData) return;
    navigator.clipboard.writeText(qrData);
    setIsCopied(true);
    toast.success(`Copied asset tag "${qrData}"`);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
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

  if (!unit) {
    return (
      <div className="p-6 text-center max-w-md mx-auto py-16">
        <QrCode className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
        <h3 className="text-lg font-semibold">Serialized Unit Not Found</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          The requested unit could not be located in the inventory system.
        </p>
        <Button asChild variant="outline">
          <Link href="/inventory-units">Back to Serialized Units</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="print:hidden">
        <PageHeader
          title={`Asset Tag: ${unit.uniqueCode || unit.id}`}
          description={`Individual physical unit of ${unit.inventoryItem?.name || "Equipment"}`}
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Inventory", href: "/inventory" },
            { label: "Serialized Units", href: "/inventory-units" },
            { label: unit.uniqueCode || unit.id },
          ]}
        >
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href="/inventory-units">
                <ArrowLeft className="w-4 h-4" />
                <span>All Units</span>
              </Link>
            </Button>
            <Button onClick={handlePrint} size="sm" className="gap-1.5">
              <Printer className="w-4 h-4" />
              <span>Print Asset Label</span>
            </Button>
          </div>
        </PageHeader>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Unit Details & History */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono font-bold bg-muted px-2.5 py-1 rounded border text-foreground select-all">
                    {unit.uniqueCode || (unit as any).qrCode || unit.id}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={handleCopyCode}
                    title="Copy code"
                  >
                    {isCopied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
                <StatusBadge status={unit.status} />
              </div>

              <CardTitle className="text-xl font-bold mt-2">
                <Link
                  href={`/inventory/${unit.inventoryItemId}`}
                  className="hover:text-primary transition-colors"
                >
                  {unit.inventoryItem?.name || "Equipment Model"}
                </Link>
              </CardTitle>
              <CardDescription className="text-xs">
                {[
                  unit.inventoryItem?.brand && `Brand: ${unit.inventoryItem.brand}`,
                  unit.inventoryItem?.model && `Model: ${unit.inventoryItem.model}`,
                  `SKU: ${unit.inventoryItem?.sku || "N/A"}`,
                ]
                  .filter(Boolean)
                  .join(" • ")}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-2">
              {/* Identifiers Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="border rounded-lg p-3 bg-muted/20">
                  <span className="text-[11px] text-muted-foreground font-medium">Serial Number</span>
                  <div className="text-sm font-mono font-bold text-foreground mt-0.5 select-all">
                    {unit.serialNumber || "—"}
                  </div>
                </div>

                <div className="border rounded-lg p-3 bg-muted/20">
                  <span className="text-[11px] text-muted-foreground font-medium">Barcode</span>
                  <div className="text-sm font-mono font-bold text-foreground mt-0.5 select-all">
                    {unit.barcode || "—"}
                  </div>
                </div>

                <div className="border rounded-lg p-3 bg-muted/20">
                  <span className="text-[11px] text-muted-foreground font-medium">Physical Condition</span>
                  <div className="mt-0.5">
                    <Badge variant="outline" className="text-xs font-semibold">
                      {unit.condition || "GOOD"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Current Physical Location */}
              <div className="p-3.5 rounded-lg bg-muted/30 border space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Current Storage Location
                </span>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="flex items-center gap-1 font-medium bg-background px-2.5 py-1 rounded border">
                    <Warehouse className="w-3.5 h-3.5 text-primary" />
                    <span>{unit.currentLocation?.name || "Central Department Store"}</span>
                    {unit.currentLocation?.code && (
                      <code className="text-[10px] text-muted-foreground">
                        [{unit.currentLocation.code}]
                      </code>
                    )}
                  </div>
                  {unit.currentLocation?.room && (
                    <>
                      <span className="text-muted-foreground">/</span>
                      <div className="flex items-center gap-1 font-medium bg-background px-2.5 py-1 rounded border">
                        <DoorClosed className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{unit.currentLocation.room.name}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Additional Meta / Dates */}
              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                {(unit as any).purchaseDate && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>Purchase: {new Date((unit as any).purchaseDate).toLocaleDateString()}</span>
                  </div>
                )}
                {(unit as any).warrantyEndDate && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Warranty Until: {new Date((unit as any).warrantyEndDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {(unit as any).notes && (
                <div className="text-xs text-muted-foreground bg-muted/20 p-3 rounded-lg border">
                  <span className="font-semibold text-foreground block mb-0.5">Custodial Notes:</span>
                  {(unit as any).notes}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Printable Asset Tag Badge */}
        <div>
          <Card className="border shadow-md overflow-hidden bg-card text-center p-6 space-y-4 print:border-2 print:border-black print:shadow-none print:m-0 print:p-4">
            <div className="border-b pb-3 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary block">
                Department of Computer Science & Engineering
              </span>
              <h3 className="font-bold text-sm text-foreground">University Inventory Asset Tag</h3>
            </div>

            {/* Generated QR Code */}
            <div className="relative w-48 h-48 mx-auto bg-white p-2 rounded-lg border shadow-xs flex items-center justify-center">
              <Image
                src={qrImageUrl}
                alt={`QR for ${qrData}`}
                width={192}
                height={192}
                className="object-contain"
                unoptimized
              />
            </div>

            <div className="space-y-1">
              <code className="text-sm font-mono font-bold bg-muted px-2.5 py-1 rounded border text-foreground block select-all">
                {unit.uniqueCode || (unit as any).qrCode || unit.id}
              </code>
              <p className="text-xs font-semibold text-foreground truncate max-w-xs mx-auto">
                {unit.inventoryItem?.name}
              </p>
              {unit.serialNumber && (
                <p className="text-[11px] font-mono text-muted-foreground">
                  SN: {unit.serialNumber}
                </p>
              )}
            </div>

            <div className="border-t pt-3 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Status: {unit.status}</span>
              <span>Condition: {unit.condition}</span>
            </div>

            <Button
              onClick={handlePrint}
              variant="outline"
              size="sm"
              className="w-full gap-1.5 print:hidden"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Barcode Label</span>
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
