"use client";

import { useState, useMemo } from "react";
import { useGetUnitsQuery } from "@/redux/api/unitApi";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Loader2, AlertCircle, CheckCircle2, Box } from "lucide-react";
import { TInventoryUnit } from "@/type";

interface SerializedUnitPickerProps {
  inventoryItemId?: string;
  locationId?: string;
  selectedUnitIds: string[];
  onChange: (unitIds: string[]) => void;
  actionLabel?: string;
}

export default function SerializedUnitPicker({
  inventoryItemId,
  locationId,
  selectedUnitIds,
  onChange,
  actionLabel = "select",
}: SerializedUnitPickerProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: unitsData, isLoading, isFetching } = useGetUnitsQuery(
    {
      inventoryItemId: inventoryItemId || undefined,
      locationId: locationId || undefined,
      status: "IN_STOCK" as any,
      limit: 200,
    },
    {
      skip: !inventoryItemId || !locationId,
    }
  );

  const units: TInventoryUnit[] = unitsData?.data || [];

  const filteredUnits = useMemo(() => {
    if (!searchTerm.trim()) return units;
    const lower = searchTerm.toLowerCase();
    return units.filter(
      (u) =>
        u.uniqueCode?.toLowerCase().includes(lower) ||
        u.serialNumber?.toLowerCase().includes(lower) ||
        u.notes?.toLowerCase().includes(lower)
    );
  }, [units, searchTerm]);

  const handleToggle = (unitId: string) => {
    if (selectedUnitIds.includes(unitId)) {
      onChange(selectedUnitIds.filter((id) => id !== unitId));
    } else {
      onChange([...selectedUnitIds, unitId]);
    }
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredUnits.map((u) => u.id);
    const combined = Array.from(new Set([...selectedUnitIds, ...allFilteredIds]));
    onChange(combined);
  };

  const handleDeselectAll = () => {
    const filteredIdSet = new Set(filteredUnits.map((u) => u.id));
    onChange(selectedUnitIds.filter((id) => !filteredIdSet.has(id)));
  };

  if (!inventoryItemId || !locationId) {
    return (
      <div className="rounded-lg border border-dashed p-3 bg-muted/20 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
        <Box className="size-4 text-muted-foreground/60" />
        <span>Select item and location to view available asset codes.</span>
      </div>
    );
  }

  if (isLoading || isFetching) {
    return (
      <div className="rounded-lg border p-4 bg-muted/20 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
        <Loader2 className="size-4 animate-spin text-primary" />
        <span>Loading active units at this location...</span>
      </div>
    );
  }

  if (units.length === 0) {
    return (
      <div className="rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 p-3 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
        <AlertCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">No active units in stock at this location</p>
          <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">
            There are zero serialized units registered with status &apos;IN_STOCK&apos; at this specific location.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 border rounded-lg p-3 bg-card/60">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-primary" />
            Specific Asset Unit Codes
          </label>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
            {selectedUnitIds.length} of {units.length} selected
          </Badge>
        </div>

        <div className="flex items-center gap-1 text-[11px]">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[11px] text-primary hover:text-primary"
            onClick={handleSelectAll}
          >
            Select All
          </Button>
          <span className="text-muted-foreground/50">|</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
            onClick={handleDeselectAll}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
        <Input
          placeholder="Filter by asset tag or serial number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8 h-8 text-xs bg-background"
        />
      </div>

      {/* Units List */}
      <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1 border rounded-md p-1.5 bg-background">
        {filteredUnits.length === 0 ? (
          <p className="text-[11px] text-center text-muted-foreground py-2 italic">
            No matching units found for &quot;{searchTerm}&quot;
          </p>
        ) : (
          filteredUnits.map((u) => {
            const isChecked = selectedUnitIds.includes(u.id);
            return (
              <div
                key={u.id}
                onClick={() => handleToggle(u.id)}
                className={`flex items-center justify-between p-2 rounded-md border text-xs cursor-pointer transition-colors ${
                  isChecked
                    ? "bg-primary/5 border-primary/40 shadow-xs"
                    : "hover:bg-muted/40 border-border/60"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => handleToggle(u.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="size-3.5"
                  />
                  <div className="flex items-center gap-2 truncate">
                    <Badge variant="outline" className="font-mono text-[11px] font-bold px-1.5 py-0 bg-background">
                      {u.uniqueCode}
                    </Badge>
                    {u.serialNumber ? (
                      <span className="text-muted-foreground text-[11px] font-mono truncate">
                        SN: {u.serialNumber}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/60 text-[10px] italic">
                        No serial #
                      </span>
                    )}
                  </div>
                </div>

                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 font-normal shrink-0 capitalize"
                >
                  {u.condition?.toLowerCase() || "Good"}
                </Badge>
              </div>
            );
          })
        )}
      </div>

      <p className="text-[10px] text-muted-foreground">
        Only selected units will be {actionLabel}ed. Stock balance will adjust automatically to match selection.
      </p>
    </div>
  );
}
