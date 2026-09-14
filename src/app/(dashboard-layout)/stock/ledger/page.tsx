"use client";

import { useState } from "react";
import { History, ArrowLeft, Boxes, Filter, RotateCcw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import SectionHeader from "@/components/shared/SectionHeader";
import SearchInput from "@/components/shared/SearchInput";
import FilterSelect from "@/components/shared/FilterSelect";
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

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Movement Type Filter */}
          <div className="w-full sm:w-48">
            <FilterSelect
              placeholder="Movement Type"
              value={type}
              onChange={(val) => {
                setType(val as TStockMovementType | "");
                setPage(1);
              }}
              options={[
                { label: "Stock Intake", value: "STOCK_IN" },
                { label: "Purchase Receipt", value: "PURCHASE" },
                { label: "Initial Stock", value: "INITIAL_STOCK" },
                { label: "Transfer", value: "TRANSFER" },
                { label: "Distribution", value: "DISTRIBUTION" },
                { label: "Return", value: "RETURN" },
                { label: "Adjustment", value: "ADJUSTMENT" },
                { label: "Stock Out", value: "STOCK_OUT" },
                { label: "Damage", value: "DAMAGE" },
                { label: "Loss", value: "LOSS" },
                { label: "Disposal", value: "DISPOSAL" },
                { label: "Reservation", value: "RESERVATION" },
                { label: "Reservation Release", value: "RESERVATION_RELEASE" },
              ]}
              includeAllOption
              allLabel="All Movement Types"
            />
          </div>

          {/* Item Filter */}
          <div className="w-full sm:w-52">
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
              allLabel="All Locations"
            />
          </div>

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
              className="text-xs h-11 px-3 text-muted-foreground hover:text-foreground gap-1.5 shrink-0"
            >
              <RotateCcw className="size-3.5" />
              <span>Reset</span>
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
