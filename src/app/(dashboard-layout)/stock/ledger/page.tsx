"use client";

import { useState } from "react";
import { History, ArrowLeft, Boxes, Filter } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import SectionHeader from "@/components/shared/SectionHeader";
import SearchInput from "@/components/shared/SearchInput";
import Pagination from "@/components/shared/Pagination";
import StockLedgerTable from "@/components/stock/StockLedgerTable";
import { useGetStockMovementsQuery } from "@/redux/api/stockApi";
import { useGetItemsQuery } from "@/redux/api/itemApi";
import { useGetStockLocationsQuery } from "@/redux/api/locationApi";
import { useDebounce } from "@/hooks/useDebounce";
import { TStockMovementType } from "@/type";

export default function StockLedgerPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);

  const [type, setType] = useState<TStockMovementType | "">("");
  const [itemId, setItemId] = useState("");
  const [locationId, setLocationId] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);

  const { data: itemsData } = useGetItemsQuery({ limit: 100 });
  const items = itemsData?.data || [];

  const { data: locationsData } = useGetStockLocationsQuery({ limit: 100 });
  const locations = locationsData?.data || [];

  const { data, isLoading } = useGetStockMovementsQuery({
    searchTerm: debouncedSearch || undefined,
    type: (type as TStockMovementType) || undefined,
    inventoryItemId: itemId || undefined,
    fromLocationId: locationId || undefined,
    page,
    limit,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const movements = data?.data || [];
  const meta = data?.meta || {
    page: 1,
    limit: 15,
    total: 0,
    totalPage: 1,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link href="/stock">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <SectionHeader
            title="Stock Movement Ledger"
            description="Immutable chronological log of all stock intakes, issues, transfers, allocations, and reconciliation counts."
          />
        </div>

        <Link href="/stock">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs shadow-xs">
            <Boxes className="size-4" />
            View Current Balances
          </Button>
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex-1">
          <SearchInput
            placeholder="Search by movement number (e.g. MOV-...) or notes..."
            value={searchTerm}
            onChange={(val) => {
              setSearchTerm(val);
              setPage(1);
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Movement Type Filter */}
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value as TStockMovementType | "");
              setPage(1);
            }}
            aria-label="Filter by Movement Type"
            className="h-9 px-3 text-xs rounded-md border border-input bg-background focus:outline-hidden focus:ring-1 focus:ring-ring"
          >
            <option value="">All Movement Types</option>
            <option value="STOCK_IN">Stock Intake</option>
            <option value="PURCHASE">Purchase Receipt</option>
            <option value="INITIAL_STOCK">Initial Stock</option>
            <option value="TRANSFER">Transfer</option>
            <option value="DISTRIBUTION">Distribution</option>
            <option value="RETURN">Return</option>
            <option value="ADJUSTMENT">Adjustment</option>
            <option value="STOCK_OUT">Stock Out</option>
            <option value="DAMAGE">Damage</option>
            <option value="LOSS">Loss</option>
            <option value="DISPOSAL">Disposal</option>
            <option value="RESERVATION">Reservation</option>
            <option value="RESERVATION_RELEASE">Reservation Release</option>
          </select>

          {/* Item Filter */}
          <select
            value={itemId}
            onChange={(e) => {
              setItemId(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by Item"
            className="h-9 px-3 text-xs rounded-md border border-input bg-background focus:outline-hidden focus:ring-1 focus:ring-ring"
          >
            <option value="">All Catalog Items</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.code})
              </option>
            ))}
          </select>

          {/* Location Filter */}
          <select
            value={locationId}
            onChange={(e) => {
              setLocationId(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by Location"
            className="h-9 px-3 text-xs rounded-md border border-input bg-background focus:outline-hidden focus:ring-1 focus:ring-ring"
          >
            <option value="">All Locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name} ({loc.code})
              </option>
            ))}
          </select>

          {(searchTerm || type || itemId || locationId) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setType("");
                setItemId("");
                setLocationId("");
                setPage(1);
              }}
              className="text-xs h-9"
            >
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* Movement Ledger Table */}
      <StockLedgerTable
        movements={movements}
        isLoading={isLoading}
      />

      {/* Pagination */}
      {!isLoading && movements.length > 0 && (
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
