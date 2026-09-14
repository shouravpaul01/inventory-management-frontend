"use client";

import { useState } from "react";
import { Plus, QrCode, Search, ScanBarcode, CheckCircle2, AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SectionHeader from "@/components/shared/SectionHeader";
import SearchInput from "@/components/shared/SearchInput";
import FilterSelect from "@/components/shared/FilterSelect";
import Pagination from "@/components/shared/Pagination";
import UnitTable from "@/components/units/UnitTable";
import UnitModal from "@/components/units/UnitModal";
import UnitUpdateModal from "@/components/units/UnitUpdateModal";
import {
  useGetUnitsQuery,
  useLazyLookupByCodeQuery,
} from "@/redux/api/unitApi";
import { useGetItemsQuery } from "@/redux/api/itemApi";
import { useGetStockLocationsQuery } from "@/redux/api/locationApi";
import { usePermission } from "@/hooks/usePermission";
import { useDebounce } from "@/hooks/useDebounce";
import { TInventoryUnit, TUnitCondition, TUnitStatus } from "@/type";
import { toast } from "sonner";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function InventoryUnitsPage() {
  const { can } = usePermission();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);

  const [itemId, setItemId] = useState("");
  const [status, setStatus] = useState<TUnitStatus | "">("");
  const [condition, setCondition] = useState<TUnitCondition | "">("");
  const [locationId, setLocationId] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Quick lookup code input
  const [lookupCode, setLookupCode] = useState("");
  const [scannedUnit, setScannedUnit] = useState<TInventoryUnit | null>(null);
  const [triggerLookup, { isFetching: isLookingUp }] = useLazyLookupByCodeQuery();

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<TInventoryUnit | null>(null);

  // Reference data
  const { data: itemsData } = useGetItemsQuery({
    trackingType: "SERIALIZED",
    limit: 100,
  });
  const serializedItems = itemsData?.data || [];

  const { data: locationsData } = useGetStockLocationsQuery({ limit: 100 });
  const locations = locationsData?.data || [];

  // Query units
  const { data, isLoading } = useGetUnitsQuery({
    searchTerm: debouncedSearch || undefined,
    inventoryItemId: itemId || undefined,
    status: (status as TUnitStatus) || undefined,
    condition: (condition as TUnitCondition) || undefined,
    locationId: locationId || undefined,
    page,
    limit,
  });

  const units = data?.data || [];
  const meta = data?.meta || {
    page: 1,
    limit: 10,
    total: 0,
    totalPage: 1,
  };

  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!lookupCode.trim()) {
      toast.error("Please enter a QR code, barcode, or unique unit tag to lookup.");
      return;
    }

    try {
      const res = await triggerLookup(lookupCode.trim()).unwrap();
      if (res?.data) {
        setScannedUnit(res.data);
        toast.success(`Found unit: ${res.data.uniqueCode}`);
      } else {
        toast.error(`No unit matching code "${lookupCode}"`);
      }
    } catch (err: any) {
      toast.error(err?.data?.message || `Unit with code "${lookupCode}" was not found.`);
      setScannedUnit(null);
    }
  };

  const handleOpenEdit = (unit: TInventoryUnit) => {
    setSelectedUnit(unit);
    setEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <SectionHeader
          title="Asset Units (Serialized)"
          description="Manage individual physical inventory items, unique asset tags, serial numbers, barcodes, condition & locations."
        />

        {can("inventory_unit.create") && (
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 shadow-xs"
          >
            <Plus className="size-4" />
            Register Units
          </Button>
        )}
      </div>

      {/* Barcode / Quick Lookup Card */}
      <Card className="border-dashed bg-muted/20 shadow-none">
        <CardContent className="p-4 sm:p-5">
          <form onSubmit={handleLookup} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground whitespace-nowrap">
              <ScanBarcode className="size-4 text-primary" />
              <span>Asset Lookup:</span>
            </div>
            <div className="relative flex-1">
              <Input
                placeholder="Scan or paste Barcode, Serial #, or Unique Code (e.g. IT-LAP-0001)..."
                value={lookupCode}
                onChange={(e) => setLookupCode(e.target.value)}
                className="h-9 pr-9"
              />
              <QrCode className="size-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
            <Button
              type="submit"
              size="sm"
              variant="secondary"
              disabled={isLookingUp}
              className="gap-1.5 whitespace-nowrap"
            >
              {isLookingUp ? "Scanning..." : "Quick Find"}
            </Button>
            {scannedUnit && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setScannedUnit(null);
                  setLookupCode("");
                }}
                className="text-xs text-muted-foreground"
              >
                Clear
              </Button>
            )}
          </form>

          {scannedUnit && (
            <div className="mt-3 p-3 rounded-lg border bg-background flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  <span className="font-semibold text-foreground">
                    {scannedUnit.inventoryItem?.name || "Asset"}
                  </span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {scannedUnit.uniqueCode}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {scannedUnit.status}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                  {scannedUnit.serialNumber && (
                    <span>SN: <span className="font-mono">{scannedUnit.serialNumber}</span></span>
                  )}
                  {scannedUnit.barcode && (
                    <span>Barcode: <span className="font-mono">{scannedUnit.barcode}</span></span>
                  )}
                  <span>Condition: <strong>{scannedUnit.condition}</strong></span>
                  {scannedUnit.location && (
                    <span>Location: <strong>{scannedUnit.location.name}</strong></span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenEdit(scannedUnit)}
                >
                  Edit / Update
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex-1">
          <SearchInput
            placeholder="Search by tag, serial number, barcode..."
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
              options={serializedItems.map((item) => ({
                label: `${item.name} (${item.code})`,
                value: item.id,
              }))}
              includeAllOption
              allLabel="All Serialized Items"
            />
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-40">
            <FilterSelect
              placeholder="Status"
              value={status}
              onChange={(val) => {
                setStatus(val as TUnitStatus | "");
                setPage(1);
              }}
              options={[
                { label: "Available", value: "AVAILABLE" },
                { label: "Allocated", value: "ALLOCATED" },
                { label: "Issued", value: "ISSUED" },
                { label: "Maintenance", value: "MAINTENANCE" },
                { label: "Under Repair", value: "UNDER_REPAIR" },
                { label: "Damaged", value: "DAMAGED" },
                { label: "Disposed", value: "DISPOSED" },
                { label: "Lost", value: "LOST" },
              ]}
              includeAllOption
              allLabel="All Statuses"
            />
          </div>

          {/* Condition Filter */}
          <div className="w-full sm:w-36">
            <FilterSelect
              placeholder="Condition"
              value={condition}
              onChange={(val) => {
                setCondition(val as TUnitCondition | "");
                setPage(1);
              }}
              options={[
                { label: "New", value: "NEW" },
                { label: "Good", value: "GOOD" },
                { label: "Fair", value: "FAIR" },
                { label: "Poor", value: "POOR" },
                { label: "Damaged", value: "DAMAGED" },
              ]}
              includeAllOption
              allLabel="All Conditions"
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

          {(searchTerm || itemId || status || condition || locationId) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setItemId("");
                setStatus("");
                setCondition("");
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

      {/* Asset Units Table */}
      <UnitTable
        units={units}
        isLoading={isLoading}
        onEdit={handleOpenEdit}
      />

      {/* Pagination */}
      {!isLoading && units.length > 0 && (
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
      <UnitModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />

      <UnitUpdateModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        unit={selectedUnit}
      />
    </div>
  );
}
