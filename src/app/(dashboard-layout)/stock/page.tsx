"use client";

import { useState } from "react";
import {
  Boxes,
  PlusCircle,
  MinusCircle,
  ArrowRightLeft,
  AlertTriangle,
  CheckCircle2,
  Package,
  Layers,
  MapPin,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionHeader from "@/components/shared/SectionHeader";
import SearchInput from "@/components/shared/SearchInput";
import FilterSelect from "@/components/shared/FilterSelect";
import Pagination from "@/components/shared/Pagination";
import StockTable from "@/components/stock/StockTable";
import StockInModal from "@/components/stock/StockInModal";
import StockOutModal from "@/components/stock/StockOutModal";
import StockTransferModal from "@/components/stock/StockTransferModal";
import StockAdjustModal from "@/components/stock/StockAdjustModal";
import { Card, CardContent } from "@/components/ui/card";
import { useGetStockBalancesQuery } from "@/redux/api/stockApi";
import { useGetItemsQuery } from "@/redux/api/itemApi";
import { useGetStockLocationsQuery } from "@/redux/api/locationApi";
import { usePermission } from "@/hooks/usePermission";
import { useDebounce } from "@/hooks/useDebounce";
import { TStockBalance } from "@/type";

export default function StockBalancesPage() {
  const { can } = usePermission();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);

  const [itemId, setItemId] = useState("");
  const [locationId, setLocationId] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Modals state
  const [stockInOpen, setStockInOpen] = useState(false);
  const [stockOutOpen, setStockOutOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState<TStockBalance | null>(null);

  // Reference data
  const { data: itemsData } = useGetItemsQuery({ limit: 100 });
  const items = itemsData?.data || [];

  const { data: locationsData } = useGetStockLocationsQuery({ limit: 100 });
  const locations = locationsData?.data || [];

  // Query balances
  const { data, isLoading } = useGetStockBalancesQuery({
    searchTerm: debouncedSearch || undefined,
    inventoryItemId: itemId || undefined,
    locationId: locationId || undefined,
    page,
    limit,
  });

  const balances = data?.data || [];
  const meta = data?.meta || {
    page: 1,
    limit: 10,
    total: 0,
    totalPage: 1,
  };

  // Metrics
  const totalAvailable = balances.reduce((acc, b) => acc + (b.availableQuantity || 0), 0);
  const lowStockCount = balances.filter(
    (b) => b.availableQuantity <= (b.inventoryItem?.minimumStock ?? 0)
  ).length;

  const handleStockIn = (balance?: TStockBalance) => {
    setSelectedBalance(balance || null);
    setStockInOpen(true);
  };

  const handleStockOut = (balance?: TStockBalance) => {
    setSelectedBalance(balance || null);
    setStockOutOpen(true);
  };

  const handleTransfer = (balance?: TStockBalance) => {
    setSelectedBalance(balance || null);
    setTransferOpen(true);
  };

  const handleAdjust = (balance: TStockBalance) => {
    setSelectedBalance(balance);
    setAdjustOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <SectionHeader
          title="Stock Balances & Inventory Levels"
          description="Real-time multi-location inventory levels, reserved stock for requisitions, and safety stock thresholds."
        />

        <div className="flex flex-wrap items-center gap-2">
          {can("stock.in") && (
            <Button
              onClick={() => handleStockIn()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs"
            >
              <PlusCircle className="size-4" />
              Stock In
            </Button>
          )}

          {can("stock.transfer") && (
            <Button
              variant="outline"
              onClick={() => handleTransfer()}
              className="flex items-center gap-1.5 shadow-xs"
            >
              <ArrowRightLeft className="size-4" />
              Transfer
            </Button>
          )}

          {can("stock.out") && (
            <Button
              variant="outline"
              onClick={() => handleStockOut()}
              className="text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950 flex items-center gap-1.5 shadow-xs"
            >
              <MinusCircle className="size-4" />
              Stock Out
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4 shadow-xs">
          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Boxes className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Active Stock Lines</p>
            <p className="text-xl font-bold text-foreground">{meta.total}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 shadow-xs">
          <div className="size-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Available Units</p>
            <p className="text-xl font-bold text-foreground">{totalAvailable}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 shadow-xs">
          <div className="size-10 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 shrink-0">
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Low Stock Alerts</p>
            <p className="text-xl font-bold text-amber-700 dark:text-amber-400">
              {lowStockCount}
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 shadow-xs">
          <div className="size-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 shrink-0">
            <MapPin className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Stock Locations</p>
            <p className="text-xl font-bold text-foreground">{locations.length}</p>
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex-1">
          <SearchInput
            placeholder="Search stock by item name, code, or location..."
            value={searchTerm}
            onChange={(val) => {
              setSearchTerm(val);
              setPage(1);
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Item Filter */}
          <div className="w-full sm:w-56">
            <FilterSelect
              placeholder="Item"
              value={itemId}
              onChange={(val) => {
                setItemId(val);
                setPage(1);
              }}
              options={items.map((item) => ({
                label: `${item.name} (${item.code})`,
                value: item.id,
              }))}
              includeAllOption
              allLabel="All Catalog Items"
            />
          </div>

          {/* Location Filter */}
          <div className="w-full sm:w-48">
            <FilterSelect
              placeholder="Location"
              value={locationId}
              onChange={(val) => {
                setLocationId(val);
                setPage(1);
              }}
              options={locations.map((loc) => ({
                label: `${loc.name} (${loc.code})`,
                value: loc.id,
              }))}
              includeAllOption
              allLabel="All Stock Locations"
            />
          </div>

          {(searchTerm || itemId || locationId) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setItemId("");
                setLocationId("");
                setPage(1);
              }}
              className="text-xs h-11 px-3 text-muted-foreground hover:text-foreground gap-1.5 shrink-0"
            >
              <RotateCcw className="size-3.5" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* Stock Balances Table */}
      <StockTable
        balances={balances}
        isLoading={isLoading}
        onStockIn={handleStockIn}
        onStockOut={handleStockOut}
        onTransfer={handleTransfer}
        onAdjust={handleAdjust}
      />

      {/* Pagination */}
      {!isLoading && balances.length > 0 && (
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

      {/* Modals */}
      <StockInModal
        open={stockInOpen}
        onOpenChange={setStockInOpen}
        defaultBalance={selectedBalance}
      />

      <StockOutModal
        open={stockOutOpen}
        onOpenChange={setStockOutOpen}
        defaultBalance={selectedBalance}
      />

      <StockTransferModal
        open={transferOpen}
        onOpenChange={setTransferOpen}
        defaultBalance={selectedBalance}
      />

      <StockAdjustModal
        open={adjustOpen}
        onOpenChange={setAdjustOpen}
        balance={selectedBalance}
      />
    </div>
  );
}
