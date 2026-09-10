"use client";

import React, { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  useGetAllBuildingsQuery,
  useGetAllFloorsQuery,
  useGetAllRoomsQuery,
  useGetAllStockLocationsQuery,
} from "@/redux/api/locationsApi";
import { Building2, Layers, DoorClosed, Warehouse } from "lucide-react";

export interface LocationCascadingValue {
  buildingId?: string;
  floorId?: string;
  roomId?: string;
  stockLocationId?: string;
}

interface LocationCascadingSelectProps {
  value: LocationCascadingValue;
  onChange: (val: LocationCascadingValue) => void;
  showStockLocation?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function LocationCascadingSelect({
  value,
  onChange,
  showStockLocation = true,
  required = false,
  disabled = false,
  className = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3",
}: LocationCascadingSelectProps) {
  const { data: buildingsRes, isLoading: isBuildingsLoading } = useGetAllBuildingsQuery();
  const { data: floorsRes, isLoading: isFloorsLoading } = useGetAllFloorsQuery();
  const { data: roomsRes, isLoading: isRoomsLoading } = useGetAllRoomsQuery();
  const { data: locationsRes, isLoading: isLocationsLoading } = useGetAllStockLocationsQuery();

  const buildings = useMemo(() => buildingsRes?.data || [], [buildingsRes]);
  const allFloors = useMemo(() => floorsRes?.data || [], [floorsRes]);
  const allRooms = useMemo(() => roomsRes?.data || [], [roomsRes]);
  const allLocations = useMemo(() => locationsRes?.data || [], [locationsRes]);

  // Filtered floors based on selected building
  const availableFloors = useMemo(() => {
    if (!value.buildingId) return allFloors;
    return allFloors.filter((f) => f.buildingId === value.buildingId);
  }, [allFloors, value.buildingId]);

  // Filtered rooms based on selected floor or building
  const availableRooms = useMemo(() => {
    if (value.floorId) {
      return allRooms.filter((r) => r.floorId === value.floorId);
    }
    if (value.buildingId) {
      return allRooms.filter((r) => r.buildingId === value.buildingId);
    }
    return allRooms;
  }, [allRooms, value.floorId, value.buildingId]);

  // Filtered storage locations based on room
  const availableLocations = useMemo(() => {
    if (!value.roomId) return allLocations;
    return allLocations.filter((l) => l.roomId === value.roomId);
  }, [allLocations, value.roomId]);

  const handleBuildingChange = (bId: string) => {
    const cleanId = bId === "ALL" ? undefined : bId;
    onChange({
      buildingId: cleanId,
      floorId: undefined,
      roomId: undefined,
      stockLocationId: undefined,
    });
  };

  const handleFloorChange = (fId: string) => {
    const cleanId = fId === "ALL" ? undefined : fId;
    // Auto-detect building from floor if not selected
    const selectedFloor = allFloors.find((f) => f.id === cleanId);
    onChange({
      ...value,
      buildingId: selectedFloor?.buildingId || value.buildingId,
      floorId: cleanId,
      roomId: undefined,
      stockLocationId: undefined,
    });
  };

  const handleRoomChange = (rId: string) => {
    const cleanId = rId === "ALL" ? undefined : rId;
    const selectedRoom = allRooms.find((r) => r.id === cleanId);
    onChange({
      ...value,
      buildingId: selectedRoom?.buildingId || value.buildingId,
      floorId: selectedRoom?.floorId || value.floorId,
      roomId: cleanId,
      stockLocationId: undefined,
    });
  };

  const handleLocationChange = (locId: string) => {
    const cleanId = locId === "ALL" ? undefined : locId;
    const selectedLoc = allLocations.find((l) => l.id === cleanId);
    onChange({
      ...value,
      roomId: selectedLoc?.roomId || value.roomId,
      stockLocationId: cleanId,
    });
  };

  return (
    <div className={className}>
      {/* 1. Building */}
      <div className="space-y-1.5">
        <Label className="text-xs flex items-center gap-1.5 font-medium text-foreground">
          <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
          Building {required && <span className="text-destructive">*</span>}
        </Label>
        <Select
          value={value.buildingId || "ALL"}
          onValueChange={handleBuildingChange}
          disabled={disabled || isBuildingsLoading}
        >
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder={isBuildingsLoading ? "Loading..." : "Select Building"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Any Building</SelectItem>
            {buildings.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name} ({b.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 2. Floor */}
      <div className="space-y-1.5">
        <Label className="text-xs flex items-center gap-1.5 font-medium text-foreground">
          <Layers className="w-3.5 h-3.5 text-muted-foreground" />
          Floor
        </Label>
        <Select
          value={value.floorId || "ALL"}
          onValueChange={handleFloorChange}
          disabled={disabled || isFloorsLoading}
        >
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder={isFloorsLoading ? "Loading..." : "Select Floor"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Any Floor</SelectItem>
            {availableFloors.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.name} {f.floorNumber !== undefined ? `(Level ${f.floorNumber})` : `(${f.code})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 3. Room */}
      <div className="space-y-1.5">
        <Label className="text-xs flex items-center gap-1.5 font-medium text-foreground">
          <DoorClosed className="w-3.5 h-3.5 text-muted-foreground" />
          Room
        </Label>
        <Select
          value={value.roomId || "ALL"}
          onValueChange={handleRoomChange}
          disabled={disabled || isRoomsLoading}
        >
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder={isRoomsLoading ? "Loading..." : "Select Room"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Any Room</SelectItem>
            {availableRooms.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name} ({r.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 4. Storage Location (Optional) */}
      {showStockLocation && (
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1.5 font-medium text-foreground">
            <Warehouse className="w-3.5 h-3.5 text-muted-foreground" />
            Storage Unit / Shelf
          </Label>
          <Select
            value={value.stockLocationId || "ALL"}
            onValueChange={handleLocationChange}
            disabled={disabled || isLocationsLoading}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder={isLocationsLoading ? "Loading..." : "Select Storage Location"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Any Storage Location</SelectItem>
              {availableLocations.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name} [{l.type}] ({l.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
