"use client";

import { useState, useMemo, useCallback, memo } from "react";
import { useFormContext, get } from "react-hook-form";
import { useGetUnitsQuery } from "@/redux/api/unitApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldLabel,
  FieldContent,
  FieldDescription,
  FieldError,
} from "@/components/ui/field";
import SearchInput from "@/components/shared/SearchInput";
import {
  CheckCircle2,
  PackageSearch,
  Inbox,
  SearchX,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TInventoryUnit, TUnitCondition } from "@/type";
import EmptyState from "@/components/shared/EmptyState";
import SerializedUnitPickerSkeleton from "./SerializedUnitPickerSkeleton";

// ============================================================================
// Types & Contracts
// ============================================================================

export interface SerializedUnitPickerProps {
  name?: string;
  inventoryItemId?: string;
  locationId?: string;
  selectedUnitIds?: string[];
  onChange?: (unitIds: string[]) => void;
  actionLabel?: string;
  label?: string;
  description?: string;
  required?: boolean;
}

const EMPTY_ARRAY: string[] = [];
const EMPTY_UNITS: TInventoryUnit[] = [];

// Helper for condition badges with semantic color coding
const CONDITION_STYLES: Record<
  TUnitCondition,
  { label: string; className: string }
> = {
  NEW: {
    label: "New",
    className:
      "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
  },
  GOOD: {
    label: "Good",
    className: "bg-sky-500/10 text-sky-600 border-sky-500/20 dark:text-sky-400",
  },
  FAIR: {
    label: "Fair",
    className:
      "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
  },
  LOST: {
    label: "Lost",
    className:
      "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400",
  },
  DISPOSED: {
    label: "Disposed",
    className:
      "bg-muted text-muted-foreground border-border",
  },
  DAMAGED: {
    label: "Damaged",
    className:
      "bg-destructive/10 text-destructive border-destructive/20 dark:text-destructive",
  },
};

// ============================================================================
// Sub-component: Memoized Unit Card for high-performance rendering (O(1) toggle)
// ============================================================================

interface SerializedUnitCardProps {
  unit: TInventoryUnit;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

const SerializedUnitCard = memo(function SerializedUnitCard({
  unit,
  isSelected,
  onToggle,
}: SerializedUnitCardProps) {
  const conditionInfo =
    CONDITION_STYLES[unit.condition] || CONDITION_STYLES.GOOD;

  return (
    <div
      role="checkbox"
      aria-checked={isSelected}
      tabIndex={0}
      onClick={(e) => {
        // Guard against Radix internal synthetic bubble events (where e.isTrusted is false)
        if (!e.isTrusted) return;
        onToggle(unit.id);
      }}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onToggle(unit.id);
        }
      }}
      className={cn(
        "group relative flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer select-none transition-all outline-none",
        "focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary",
        isSelected
          ? "bg-primary/5 border-primary/50 ring-1 ring-primary/20 shadow-2xs"
          : "hover:bg-muted/40 border-border/70 hover:border-border",
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {/*
          Shadcn Checkbox rendered with pointer-events-none:
          - Prevents duplicate click targets
          - Entire card acts as the unified interactive checkbox
          - Radix synthetic bubbles are stopped by the !e.isTrusted guard above
        */}
        <Checkbox
          checked={isSelected}
          tabIndex={-1}
          aria-hidden="true"
          className="size-3.5 shrink-0 pointer-events-none"
        />

        <div className="flex flex-col min-w-0 leading-tight">
          <span
            className="font-mono text-[11px] font-semibold text-foreground truncate"
            title={unit.uniqueCode}
          >
            {unit.uniqueCode}
          </span>
          {unit.serialNumber ? (
            <span
              className="text-muted-foreground text-[10px] font-mono truncate"
              title={`SN: ${unit.serialNumber}`}
            >
              SN: {unit.serialNumber}
            </span>
          ) : (
            <span className="text-muted-foreground/60 text-[10px] italic">
              No serial number
            </span>
          )}
        </div>
      </div>

      <Badge
        variant="outline"
        className={cn(
          "text-[9px] px-1.5 py-0 font-medium shrink-0 capitalize ml-1.5 transition-colors",
          conditionInfo.className,
        )}
      >
        {conditionInfo.label}
      </Badge>
    </div>
  );
});

// ============================================================================
// Main Component: SerializedUnitPicker
// ============================================================================

export function SerializedUnitPicker({
  name = "unitIds",
  inventoryItemId,
  locationId,
  selectedUnitIds,
  onChange,
  actionLabel = "select",
  label = "Available Physical Units",
  description,
  required = false,
}: SerializedUnitPickerProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const formContext = useFormContext();
  const isControlled = selectedUnitIds !== undefined;

  // React Hook Form subscriptions (only if uncontrolled)
  const formValue =
    !isControlled && formContext ? formContext.watch(name) : undefined;

  const currentSelected: string[] = isControlled
    ? selectedUnitIds
    : Array.isArray(formValue)
      ? formValue
      : EMPTY_ARRAY;

  const error =
    !isControlled && formContext
      ? (get(formContext.formState.errors, name)?.message as string | undefined)
      : undefined;

  // Fallback watchers only when props are not provided
  const fallbackItemId =
    !inventoryItemId && formContext
      ? (formContext.watch("inventoryItemId") as string | undefined)
      : undefined;

  const fallbackLocationId =
    !locationId && formContext
      ? ((formContext.watch("locationId") as string | undefined) ??
        (formContext.watch("fromLocationId") as string | undefined))
      : undefined;

  const currentItemId = inventoryItemId ?? fallbackItemId;
  const currentLocationId = locationId ?? fallbackLocationId;

  // Query units with proper skip guard
  const {
    data: unitsData,
    isLoading,
    isFetching,
  } = useGetUnitsQuery(
    {
      inventoryItemId: currentItemId || undefined,
      locationId: currentLocationId || undefined,
      status: "IN_STOCK" as any,
      limit: 200,
    },
    {
      skip: !currentItemId || !currentLocationId,
    },
  );

  const units: TInventoryUnit[] = unitsData?.data || EMPTY_UNITS;

  // O(1) set lookup for selected items
  const selectedSet = useMemo(
    () => new Set(currentSelected),
    [currentSelected],
  );

  // Filtered units based on trimmed query
  const filteredUnits = useMemo(() => {
    const trimmed = searchTerm.trim().toLowerCase();
    if (!trimmed) return units;

    return units.filter(
      (u) =>
        u.uniqueCode?.toLowerCase().includes(trimmed) ||
        u.serialNumber?.toLowerCase().includes(trimmed) ||
        u.notes?.toLowerCase().includes(trimmed),
    );
  }, [units, searchTerm]);

  // Update handler
  const updateSelected = useCallback(
    (next: string[]) => {
      if (onChange) {
        onChange(next);
      } else if (formContext) {
        formContext.setValue(name, next, {
          shouldValidate: true,
          shouldDirty: true,
        });
        const targetQty = next.length > 0 ? next.length : 1;
        if (Number(formContext.getValues("quantity")) !== targetQty) {
          formContext.setValue("quantity", targetQty, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }
      }
    },
    [onChange, formContext, name],
  );

  // Toggle unit handler
  const handleToggle = useCallback(
    (unitId: string) => {
      if (selectedSet.has(unitId)) {
        updateSelected(currentSelected.filter((id) => id !== unitId));
      } else {
        updateSelected([...currentSelected, unitId]);
      }
    },
    [selectedSet, currentSelected, updateSelected],
  );

  // Bulk actions
  const handleSelectAll = useCallback(() => {
    const allFilteredIds = filteredUnits.map((u) => u.id);
    const combined = Array.from(
      new Set([...currentSelected, ...allFilteredIds]),
    );
    updateSelected(combined);
  }, [filteredUnits, currentSelected, updateSelected]);

  const handleDeselectAll = useCallback(() => {
    const filteredIdSet = new Set(filteredUnits.map((u) => u.id));
    updateSelected(currentSelected.filter((id) => !filteredIdSet.has(id)));
  }, [filteredUnits, currentSelected, updateSelected]);

  // Content state rendering
  const renderContent = () => {
    if (!currentItemId || !currentLocationId) {
      return (
        <EmptyState
          compact
          icon={<PackageSearch className="size-5" />}
          title="Item & Location Required"
          description="Select both an inventory item and a stock location to retrieve available unit codes."
        />
      );
    }

    if (isLoading || isFetching) {
      return <SerializedUnitPickerSkeleton />;
    }

    if (units.length === 0) {
      return (
        <EmptyState
          compact
          icon={<Inbox className="size-5 text-amber-600 dark:text-amber-400" />}
          title="No Units in Stock"
          description="There are currently zero serialized physical units registered with status 'IN_STOCK' at this location."
          className="border-amber-200/70 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/15"
        />
      );
    }

    const allFilteredSelected =
      filteredUnits.length > 0 &&
      filteredUnits.every((u) => selectedSet.has(u.id));

    return (
      <div className="space-y-2.5 border rounded-lg p-3 bg-card/60">
        {/* Header bar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className=" font-medium text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-primary" />
              Available Physical Units
            </span>
            <Badge
              variant={
                currentSelected.length === units.length && units.length > 0
                  ? "default"
                  : "secondary"
              }
              className="text-[10px] px-1.5 py-0 font-mono transition-colors"
            >
              {currentSelected.length === units.length && units.length > 0
                ? `All ${units.length} selected`
                : `${currentSelected.length} of ${units.length} selected`}
            </Badge>
          </div>

          <div className="flex items-center gap-1 text-[11px]">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={allFilteredSelected}
              className=" px-2 text-primary hover:text-primary cursor-pointer disabled:opacity-40"
              onClick={handleSelectAll}
            >
              Select All
            </Button>
            <span className="text-muted-foreground/40">|</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={currentSelected.length === 0}
              className=" px-2 "
              onClick={handleDeselectAll}
            >
              Clear
            </Button>
          </div>
        </div>

        {/* Search Filter */}
        <SearchInput
          placeholder="Filter by asset tag or serial number..."
          value={searchTerm}
          onChange={setSearchTerm}
          className="h-10! bg-background "
        />

        {/* Units Grid Layout */}
        <div className=" pr-1">
          {filteredUnits.length === 0 ? (
            <EmptyState
              compact
              icon={<SearchX className="size-5" />}
              title="No Matching Units"
              description={`No asset codes or serial numbers matched "${searchTerm}".`}
              action={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5 cursor-pointer"
                  onClick={() => setSearchTerm("")}
                >
                  <RotateCcw className="size-3" />
                  Clear filter
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredUnits.map((u) => (
                <SerializedUnitCard
                  key={u.id}
                  unit={u}
                  isSelected={selectedSet.has(u.id)}
                  onToggle={handleToggle}
                />
              ))}
            </div>
          )}
        </div>

        <p className="text-[10px] text-muted-foreground">
          Only selected units will be {actionLabel}ed. Quantity will adjust
          automatically to match selection.
        </p>
      </div>
    );
  };

  return (
    <Field>
      {label && (
        <FieldLabel
          htmlFor={name}
          className="flex items-center justify-between"
        >
          <span>{label}</span>
          {required && <span className="text-destructive">*</span>}
        </FieldLabel>
      )}

      <FieldContent>{renderContent()}</FieldContent>

      {description && <FieldDescription>{description}</FieldDescription>}
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
}

export default SerializedUnitPicker;
