"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ScanLine,
  Search,
  QrCode,
  Warehouse,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useLazyLookupUnitByCodeQuery } from "@/redux/api/inventoryUnitsApi";
import { toast } from "sonner";

export default function AssetLookupPage() {
  const [codeQuery, setCodeQuery] = useState("");
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [triggerLookup, { data: lookupRes, isLoading, isError, error }] =
    useLazyLookupUnitByCodeQuery();

  const foundUnit = lookupRes?.data;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = codeQuery.trim();
    if (!query) {
      toast.error("Please enter an asset tag, serial number, or QR value.");
      return;
    }

    try {
      await triggerLookup(query).unwrap();
      setRecentQueries((prev) => {
        const next = [query, ...prev.filter((q) => q !== query)].slice(0, 5);
        return next;
      });
    } catch (err: any) {
      toast.error(err?.data?.message || `No unit found matching "${query}".`);
    }
  };

  const handleRecentClick = (q: string) => {
    setCodeQuery(q);
    triggerLookup(q);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Asset Tag & QR Code Scanner"
        description="Scan or manually enter barcoded physical asset tags and QR codes to instantaneously inspect unit condition, custodian status, and location."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Inventory", href: "/inventory" },
          { label: "Serialized Units", href: "/inventory-units" },
          { label: "Scan & Lookup" },
        ]}
      />

      {/* Lookup Bar Card */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-primary" />
            <span>Scan or Enter Asset Tag</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Supports hardware barcode/QR scanners in keyboard emulation mode or manual alphanumeric input.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <QrCode className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="e.g. AST-2026-000001, SN-983411, or paste scanned QR code..."
                value={codeQuery}
                onChange={(e) => setCodeQuery(e.target.value)}
                className="pl-10 h-11 font-mono text-sm"
                autoFocus
              />
            </div>
            <Button type="submit" disabled={isLoading} className="h-11 px-6 gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" /> Inspect Unit
                </>
              )}
            </Button>
          </form>

          {/* Recent Queries */}
          {recentQueries.length > 0 && (
            <div className="flex items-center gap-2 text-xs pt-1">
              <span className="text-muted-foreground font-medium">Recent lookups:</span>
              <div className="flex flex-wrap gap-1.5">
                {recentQueries.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleRecentClick(q)}
                    className="font-mono bg-muted hover:bg-muted/80 px-2 py-0.5 rounded border text-[11px] text-foreground transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Result Area */}
      {foundUnit ? (
        <Card className="border shadow-md overflow-hidden animate-in fade-in-50 duration-200">
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border-b border-emerald-200 dark:border-emerald-800 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 font-semibold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Unit Verified in Registry</span>
            </div>
            <StatusBadge status={foundUnit.status} />
          </div>

          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <code className="text-sm font-mono font-bold bg-muted px-2.5 py-1 rounded border text-foreground select-all">
                  {foundUnit.uniqueCode || (foundUnit as any).qrCode || foundUnit.id}
                </code>
                <CardTitle className="text-xl font-bold mt-2 text-foreground">
                  {foundUnit.inventoryItem?.name || "Equipment Model"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {[
                    foundUnit.inventoryItem?.brand && `Brand: ${foundUnit.inventoryItem.brand}`,
                    foundUnit.inventoryItem?.model && `Model: ${foundUnit.inventoryItem.model}`,
                    `SKU: ${foundUnit.inventoryItem?.sku || "N/A"}`,
                  ]
                    .filter(Boolean)
                    .join(" • ")}
                </CardDescription>
              </div>

              {foundUnit.inventoryItem?.imageUrl && (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden border shrink-0 bg-muted">
                  <Image
                    src={foundUnit.inventoryItem.imageUrl}
                    alt={foundUnit.inventoryItem.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-1">
            {/* Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="border rounded-lg p-3 bg-muted/20">
                <span className="text-[11px] text-muted-foreground font-medium">Serial Number</span>
                <div className="text-xs font-mono font-bold text-foreground mt-0.5 select-all">
                  {foundUnit.serialNumber || "—"}
                </div>
              </div>

              <div className="border rounded-lg p-3 bg-muted/20">
                <span className="text-[11px] text-muted-foreground font-medium">Physical Condition</span>
                <div className="mt-0.5">
                  <Badge variant="outline" className="text-xs font-semibold">
                    {foundUnit.condition || "GOOD"}
                  </Badge>
                </div>
              </div>

              <div className="border rounded-lg p-3 bg-muted/20">
                <span className="text-[11px] text-muted-foreground font-medium">Tracking Type</span>
                <div className="text-xs font-bold text-foreground mt-0.5">
                  {foundUnit.inventoryItem?.trackingType || "SERIALIZED"}
                </div>
              </div>

              <div className="border rounded-lg p-3 bg-muted/20">
                <span className="text-[11px] text-muted-foreground font-medium">Return Required</span>
                <div className="text-xs font-bold text-foreground mt-0.5">
                  {foundUnit.inventoryItem?.isReturnable ? "YES (Returnable)" : "NO"}
                </div>
              </div>
            </div>

            {/* Current Location */}
            <div className="p-3.5 rounded-lg bg-muted/30 border space-y-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Current Stored Location
              </span>
              <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                <Warehouse className="w-4 h-4 text-primary" />
                <span>{foundUnit.currentLocation?.name || "Central Department Store"}</span>
                {foundUnit.currentLocation?.code && (
                  <code className="text-[11px] text-muted-foreground">
                    [{foundUnit.currentLocation.code}]
                  </code>
                )}
              </div>
            </div>
          </CardContent>

          <CardFooter className="bg-muted/10 border-t p-4 flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-muted-foreground">
              Last updated: {new Date(foundUnit.updatedAt || foundUnit.createdAt).toLocaleString()}
            </div>

            <div className="flex items-center gap-2">
              <Button asChild size="sm" className="gap-1.5">
                <Link href={`/inventory-units/${foundUnit.id}`}>
                  <span>Full Asset Details & QR</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </div>
          </CardFooter>
        </Card>
      ) : isError ? (
        <Card className="border border-destructive/30 bg-destructive/5 p-8 text-center">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-2 opacity-80" />
          <h3 className="font-semibold text-foreground text-base">Asset Tag Not Found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {(error as any)?.data?.message ||
              `The asset identifier "${codeQuery}" was not located in the university inventory database.`}
          </p>
        </Card>
      ) : null}
    </div>
  );
}
