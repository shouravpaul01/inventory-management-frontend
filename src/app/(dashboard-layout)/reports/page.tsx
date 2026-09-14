"use client";

import { useState } from "react";
import {
  BarChart3,
  AlertTriangle,
  Download,
  Package,
  QrCode,
  RotateCcw,
  Boxes,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import SectionHeader from "@/components/shared/SectionHeader";
import TableEmpty from "@/components/shared/TableEmpty";
import TableLoading from "@/components/shared/TableLoading";
import { usePermission } from "@/hooks/usePermission";
import {
  useGetLowStockReportQuery,
  useGetMyAssignedAssetsQuery,
  useGetOverdueReturnsQuery,
  useGetDashboardOverviewQuery,
} from "@/redux/api/reportApi";
import { toast } from "sonner";

export default function ReportsPage() {
  const { can } = usePermission();
  const canViewReports = can("report.view");

  const [activeTab, setActiveTab] = useState<
    "low_stock" | "my_assets" | "overdue" | "overview"
  >(canViewReports ? "low_stock" : "my_assets");

  const { data: lowStockData, isLoading: isLowStockLoading } =
    useGetLowStockReportQuery(undefined, { skip: !canViewReports });
  const lowStockItems = lowStockData?.data?.data || [];

  const { data: myAssetsData, isLoading: isMyAssetsLoading } =
    useGetMyAssignedAssetsQuery();
  const myAssets = myAssetsData?.data || [];

  const { data: overdueData, isLoading: isOverdueLoading } =
    useGetOverdueReturnsQuery(undefined, { skip: !canViewReports });
  const overdueLoans = overdueData?.data || [];

  const { data: overviewData, isLoading: isOverviewLoading } =
    useGetDashboardOverviewQuery(undefined, { skip: !canViewReports });
  const overview = overviewData?.data;

  const handleExportLowStock = () => {
    if (lowStockItems.length === 0) {
      toast.error("No low stock items to export.");
      return;
    }
    const headers = ["Item Name", "Item Code", "Category", "Minimum Stock", "Reorder Level", "Total On Hand", "Total Available", "Deficit"];
    const rows = lowStockItems.map((i) => [
      i.itemName,
      i.itemCode,
      i.category,
      i.minimumStock,
      i.reorderLevel,
      i.totalOnHand,
      i.totalAvailable,
      i.deficit,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((v) => `"${v}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `low-stock-reorder-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Low stock reorder report exported to CSV.");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <SectionHeader
          title="Reports & Valuation Analytics"
          description="Executive inventory metrics, safety stock thresholds, assigned faculty assets, and overdue returns."
        />

        {activeTab === "low_stock" && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportLowStock}
            className="gap-1.5 text-xs shadow-xs"
          >
            <Download className="size-4" />
            Export Reorder CSV
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b pb-3">
        {canViewReports && (
          <Button
            size="sm"
            variant={activeTab === "low_stock" ? "default" : "outline"}
            onClick={() => setActiveTab("low_stock")}
            className="gap-1.5 text-xs h-8"
          >
            <AlertTriangle className="size-3.5" />
            Low Stock Reorder Monitor
            {lowStockItems.length > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 ml-1">
                {lowStockItems.length}
              </Badge>
            )}
          </Button>
        )}

        <Button
          size="sm"
          variant={activeTab === "my_assets" ? "default" : "outline"}
          onClick={() => setActiveTab("my_assets")}
          className="gap-1.5 text-xs h-8"
        >
          <QrCode className="size-3.5" />
          My Assigned Assets
          {myAssets.length > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 ml-1">
              {myAssets.length}
            </Badge>
          )}
        </Button>

        {canViewReports && (
          <>
            <Button
              size="sm"
              variant={activeTab === "overdue" ? "default" : "outline"}
              onClick={() => setActiveTab("overdue")}
              className="gap-1.5 text-xs h-8"
            >
              <RotateCcw className="size-3.5" />
              Overdue Return Loans
            </Button>

            <Button
              size="sm"
              variant={activeTab === "overview" ? "default" : "outline"}
              onClick={() => setActiveTab("overview")}
              className="gap-1.5 text-xs h-8"
            >
              <BarChart3 className="size-3.5" />
              Stock Valuation Summary
            </Button>
          </>
        )}
      </div>

      {/* Tab 1: Low Stock Reorder Table */}
      {activeTab === "low_stock" && (
        <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="font-semibold text-xs py-3.5">Item Details</TableHead>
                  <TableHead className="font-semibold text-xs py-3.5">Category</TableHead>
                  <TableHead className="font-semibold text-xs py-3.5 text-center">Safety Minimum</TableHead>
                  <TableHead className="font-semibold text-xs py-3.5 text-center">Reorder Threshold</TableHead>
                  <TableHead className="font-semibold text-xs py-3.5 text-center">Current Available</TableHead>
                  <TableHead className="font-semibold text-xs py-3.5 text-center">Deficit Need</TableHead>
                  <TableHead className="font-semibold text-xs py-3.5">Locations Distribution</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLowStockLoading ? (
                  <TableLoading colSpan={7} />
                ) : lowStockItems.length === 0 ? (
                  <TableEmpty
                    colSpan={7}
                    message="All inventory stock levels are healthy."
                    description="No items are currently below minimum safety stock thresholds."
                  />
                ) : (
                  lowStockItems.map((item) => (
                    <TableRow key={item.itemId} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="py-3">
                        <p className="font-medium text-xs text-foreground">{item.itemName}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">{item.itemCode}</p>
                      </TableCell>

                      <TableCell className="py-3">
                        <Badge variant="outline" className="text-xs">
                          {item.category}
                        </Badge>
                      </TableCell>

                      <TableCell className="py-3 text-center text-xs font-medium text-muted-foreground">
                        {item.minimumStock}
                      </TableCell>

                      <TableCell className="py-3 text-center text-xs font-medium text-muted-foreground">
                        {item.reorderLevel}
                      </TableCell>

                      <TableCell className="py-3 text-center">
                        <span className="font-bold text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded-full">
                          {item.totalAvailable}
                        </span>
                      </TableCell>

                      <TableCell className="py-3 text-center font-bold text-xs text-amber-600">
                        +{item.deficit}
                      </TableCell>

                      <TableCell className="py-3 text-xs text-muted-foreground">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {item.locations.map((loc) => (
                            <span key={loc.locationId} className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">
                              {loc.locationName}: {loc.availableQuantity}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Tab 2: My Assigned Assets */}
      {activeTab === "my_assets" && (
        <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="font-semibold text-xs py-3.5">Asset Tag</TableHead>
                  <TableHead className="font-semibold text-xs py-3.5">Item Name</TableHead>
                  <TableHead className="font-semibold text-xs py-3.5">Serial #</TableHead>
                  <TableHead className="font-semibold text-xs py-3.5">Barcode</TableHead>
                  <TableHead className="font-semibold text-xs py-3.5 text-center">Condition</TableHead>
                  <TableHead className="font-semibold text-xs py-3.5 text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isMyAssetsLoading ? (
                  <TableLoading colSpan={6} />
                ) : myAssets.length === 0 ? (
                  <TableEmpty
                    colSpan={6}
                    message="No physical assets currently checked out to your account."
                    description="When university equipment is issued or allocated to you, it will be listed here."
                  />
                ) : (
                  myAssets.map((unit) => (
                    <TableRow key={unit.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="py-3 font-mono text-xs font-bold text-foreground">
                        {unit.uniqueCode}
                      </TableCell>

                      <TableCell className="py-3">
                        <p className="font-medium text-xs text-foreground">
                          {unit.inventoryItem?.name || "Asset"}
                        </p>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {unit.inventoryItem?.code}
                        </span>
                      </TableCell>

                      <TableCell className="py-3 font-mono text-xs text-muted-foreground">
                        {unit.serialNumber || "—"}
                      </TableCell>

                      <TableCell className="py-3 font-mono text-xs text-muted-foreground">
                        {unit.barcode || "—"}
                      </TableCell>

                      <TableCell className="py-3 text-center">
                        <Badge variant="outline" className="text-[10px]">
                          {unit.condition}
                        </Badge>
                      </TableCell>

                      <TableCell className="py-3 text-center">
                        <Badge variant="secondary" className="text-[10px]">
                          {unit.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Tab 3: Overdue Loans */}
      {activeTab === "overdue" && (
        <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="font-semibold text-xs py-3.5">Distribution #</TableHead>
                  <TableHead className="font-semibold text-xs py-3.5">Borrower</TableHead>
                  <TableHead className="font-semibold text-xs py-3.5">Expected Return Date</TableHead>
                  <TableHead className="font-semibold text-xs py-3.5 text-center">Overdue Days</TableHead>
                  <TableHead className="font-semibold text-xs py-3.5 text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isOverdueLoading ? (
                  <TableLoading colSpan={5} />
                ) : overdueLoans.length === 0 ? (
                  <TableEmpty
                    colSpan={5}
                    message="No overdue equipment loans found."
                    description="All borrowed university equipment is within acceptable return loan schedules."
                  />
                ) : (
                  overdueLoans.map((loan: any, idx) => (
                    <TableRow key={loan.id || idx} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="py-3 font-mono text-xs font-semibold text-foreground">
                        {loan.distributionNo || "DIS-LOAN"}
                      </TableCell>

                      <TableCell className="py-3 text-xs">
                        {loan.receiver ? `${loan.receiver.firstName} ${loan.receiver.lastName}` : "Faculty"}
                      </TableCell>

                      <TableCell className="py-3 text-xs text-muted-foreground">
                        {loan.expectedReturnAt ? new Date(loan.expectedReturnAt).toLocaleDateString() : "Overdue"}
                      </TableCell>

                      <TableCell className="py-3 text-center font-bold text-xs text-rose-600">
                        {loan.overdueDays ? `${loan.overdueDays} days` : "Overdue"}
                      </TableCell>

                      <TableCell className="py-3 text-center">
                        <Badge variant="destructive" className="text-[10px]">
                          OVERDUE
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Tab 4: Valuation Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-5 space-y-3">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Package className="size-4 text-primary" />
              Catalog Valuation
            </h3>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Active Items:</span>
                <span className="font-bold text-foreground">{overview?.catalog?.totalItems ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Academic Departments:</span>
                <span className="font-bold text-foreground">{overview?.catalog?.departments ?? 0}</span>
              </div>
            </div>
          </Card>

          <Card className="p-5 space-y-3">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <QrCode className="size-4 text-indigo-600" />
              Serialized Asset Lifecycle
            </h3>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Tracked Units:</span>
                <span className="font-bold text-foreground">{overview?.serializedAssets?.total ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">In Warehouse / Storage:</span>
                <span className="font-bold text-emerald-600">{overview?.serializedAssets?.inStock ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Currently Issued:</span>
                <span className="font-bold text-sky-600">{overview?.serializedAssets?.issued ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">In Repair / Maintenance:</span>
                <span className="font-bold text-amber-600">{overview?.serializedAssets?.maintenance ?? 0}</span>
              </div>
            </div>
          </Card>

          <Card className="p-5 space-y-3">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Boxes className="size-4 text-emerald-600" />
              Bulk Consumables Balance
            </h3>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gross On-Hand Quantity:</span>
                <span className="font-bold text-foreground">{overview?.bulkStock?.totalQuantity ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Free Available Units:</span>
                <span className="font-bold text-emerald-600">{overview?.bulkStock?.availableQuantity ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reserved for Requisitions:</span>
                <span className="font-bold text-amber-600">{overview?.bulkStock?.reservedQuantity ?? 0}</span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
