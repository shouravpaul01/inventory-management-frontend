"use client";

import SearchInput from "@/components/shared/SearchInput";
import FilterSelect from "@/components/shared/FilterSelect";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TCategory } from "@/type";
import { RotateCcw, Filter, PackageCheck, Repeat, Gift, ShieldAlert } from "lucide-react";

interface CatalogFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  categories: TCategory[];
  selectedCategoryId: string;
  onCategoryChange: (value: string) => void;
  policyFilter: string;
  onPolicyFilterChange: (value: string) => void;
  stockFilter: "ALL" | "IN_STOCK" | "LOW_STOCK";
  onStockFilterChange: (value: "ALL" | "IN_STOCK" | "LOW_STOCK") => void;
  onReset: () => void;
  totalFiltered: number;
}

export default function CatalogFilterBar({
  searchTerm,
  onSearchChange,
  categories,
  selectedCategoryId,
  onCategoryChange,
  policyFilter,
  onPolicyFilterChange,
  stockFilter,
  onStockFilterChange,
  onReset,
  totalFiltered,
}: CatalogFilterBarProps) {
  const categoryOptions = [
    { value: "ALL", label: "All Categories" },
    ...categories.map((c) => ({
      value: c.id,
      label: c.name,
    })),
  ];

  const policyOptions = [
    { value: "ALL", label: "All Issue Policies" },
    { value: "PERMANENT", label: "Permanent Allocation" },
    { value: "TEMPORARY", label: "Temporary Equipment Loan" },
    { value: "GIFT", label: "Institutional Gift / Grant" },
  ];

  const hasActiveFilters =
    Boolean(searchTerm) ||
    (selectedCategoryId && selectedCategoryId !== "ALL") ||
    (policyFilter && policyFilter !== "ALL") ||
    stockFilter !== "ALL";

  return (
    <div className="space-y-3 bg-card p-3.5 rounded-xl border border-border/70 shadow-2xs">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="sm:col-span-2 lg:col-span-2">
          <SearchInput
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Search items by name, code, brand, model or SKU..."
          />
        </div>

        {/* Category Filter */}
        <div>
          <FilterSelect
            value={selectedCategoryId || "ALL"}
            onChange={onCategoryChange}
            options={categoryOptions}
            placeholder="All Categories"
          />
        </div>

        {/* Issue Policy Filter */}
        <div>
          <FilterSelect
            value={policyFilter || "ALL"}
            onChange={onPolicyFilterChange}
            options={policyOptions}
            placeholder="All Issue Policies"
          />
        </div>
      </div>

      {/* Quick Filter Badges / Chips */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/40 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-muted-foreground font-medium flex items-center gap-1 mr-1">
            <Filter className="size-3" />
            Stock Availability:
          </span>

          <Button
            type="button"
            size="sm"
            variant={stockFilter === "ALL" ? "default" : "outline"}
            className="h-7 text-xs px-2.5 rounded-full"
            onClick={() => onStockFilterChange("ALL")}
          >
            All Items
          </Button>

          <Button
            type="button"
            size="sm"
            variant={stockFilter === "IN_STOCK" ? "default" : "outline"}
            className={`h-7 text-xs px-2.5 rounded-full gap-1 ${
              stockFilter === "IN_STOCK" ? "" : "hover:text-emerald-600"
            }`}
            onClick={() => onStockFilterChange("IN_STOCK")}
          >
            <PackageCheck className="size-3 text-emerald-500" />
            In Stock Available
          </Button>

          <Button
            type="button"
            size="sm"
            variant={stockFilter === "LOW_STOCK" ? "default" : "outline"}
            className={`h-7 text-xs px-2.5 rounded-full gap-1 ${
              stockFilter === "LOW_STOCK" ? "" : "hover:text-amber-600"
            }`}
            onClick={() => onStockFilterChange("LOW_STOCK")}
          >
            <ShieldAlert className="size-3 text-amber-500" />
            Low Stock Alert
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs font-mono">
            Showing <strong className="text-foreground">{totalFiltered}</strong> items
          </span>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground gap-1"
            >
              <RotateCcw className="size-3" />
              Reset
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
