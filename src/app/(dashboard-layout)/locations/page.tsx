"use client";

import { useState } from "react";
import {
  Building2,
  DoorOpen,
  Archive,
  Plus,
  Trash2,
  MoreHorizontal,
  MapPin,
} from "lucide-react";
import SectionHeader from "@/components/shared/SectionHeader";
import SearchInput from "@/components/shared/SearchInput";
import Pagination from "@/components/shared/Pagination";
import TableEmpty from "@/components/shared/TableEmpty";
import TableLoading from "@/components/shared/TableLoading";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  useGetBuildingsQuery,
  useDeleteBuildingMutation,
  useGetRoomsQuery,
  useDeleteRoomMutation,
  useGetStockLocationsQuery,
  useDeleteStockLocationMutation,
} from "@/redux/api/locationApi";
import { usePermission } from "@/hooks/usePermission";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";

import BuildingModal from "@/components/locations/BuildingModal";
import RoomModal from "@/components/locations/RoomModal";
import StockLocationModal from "@/components/locations/StockLocationModal";

type TActiveTab = "units" | "rooms" | "buildings";

export default function LocationsPage() {
  const { can } = usePermission();
  const [activeTab, setActiveTab] = useState<TActiveTab>("units");

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Modals state
  const [buildingModalOpen, setBuildingModalOpen] = useState(false);
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [stockLocationModalOpen, setStockLocationModalOpen] = useState(false);

  // Delete Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    name: string;
    type: "building" | "room" | "unit";
  } | null>(null);

  // Queries
  const { data: stockLocationsData, isLoading: isLoadingUnits } =
    useGetStockLocationsQuery(
      activeTab === "units"
        ? { searchTerm: debouncedSearch || undefined, page, limit }
        : undefined
    );

  const { data: roomsData, isLoading: isLoadingRooms } = useGetRoomsQuery(
    activeTab === "rooms"
      ? { searchTerm: debouncedSearch || undefined, page, limit }
      : undefined
  );

  const { data: buildingsData, isLoading: isLoadingBuildings } =
    useGetBuildingsQuery(
      activeTab === "buildings"
        ? { searchTerm: debouncedSearch || undefined, page, limit }
        : undefined
    );

  // Delete Mutations
  const [deleteBuilding, { isLoading: isDeletingBuilding }] =
    useDeleteBuildingMutation();
  const [deleteRoom, { isLoading: isDeletingRoom }] = useDeleteRoomMutation();
  const [deleteStockLocation, { isLoading: isDeletingStockLocation }] =
    useDeleteStockLocationMutation();

  const isDeleting =
    isDeletingBuilding || isDeletingRoom || isDeletingStockLocation;

  const stockLocations = stockLocationsData?.data || [];
  const rooms = roomsData?.data || [];
  const buildings = buildingsData?.data || [];

  const handleOpenDelete = (
    id: string,
    name: string,
    type: "building" | "room" | "unit"
  ) => {
    setItemToDelete({ id, name, type });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      if (itemToDelete.type === "building") {
        await deleteBuilding(itemToDelete.id).unwrap();
      } else if (itemToDelete.type === "room") {
        await deleteRoom(itemToDelete.id).unwrap();
      } else {
        await deleteStockLocation(itemToDelete.id).unwrap();
      }
      toast.success(`${itemToDelete.name} deleted successfully.`);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete location record");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <SectionHeader
          title="Campus Locations & Storage"
          description="Manage physical campus infrastructure: storage units, department rooms, and buildings."
        />

        {can("location.create") && (
          <div className="flex items-center gap-2">
            {activeTab === "units" && (
              <Button
                onClick={() => setStockLocationModalOpen(true)}
                className="gap-1.5 shadow-xs"
              >
                <Plus className="size-4" />
                <span>Add Storage Unit</span>
              </Button>
            )}
            {activeTab === "rooms" && (
              <Button
                onClick={() => setRoomModalOpen(true)}
                className="gap-1.5 shadow-xs"
              >
                <Plus className="size-4" />
                <span>Add Room / Lab</span>
              </Button>
            )}
            {activeTab === "buildings" && (
              <Button
                onClick={() => setBuildingModalOpen(true)}
                className="gap-1.5 shadow-xs"
              >
                <Plus className="size-4" />
                <span>Add Building</span>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border/80 gap-6">
        <button
          onClick={() => {
            setActiveTab("units");
            setSearchTerm("");
            setPage(1);
          }}
          className={`flex items-center gap-2 pb-3 text-xs font-semibold transition-all border-b-2 ${
            activeTab === "units"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Archive className="size-4" />
          <span>Storage Units & Shelves ({stockLocations.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("rooms");
            setSearchTerm("");
            setPage(1);
          }}
          className={`flex items-center gap-2 pb-3 text-xs font-semibold transition-all border-b-2 ${
            activeTab === "rooms"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <DoorOpen className="size-4" />
          <span>Rooms & Labs ({rooms.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("buildings");
            setSearchTerm("");
            setPage(1);
          }}
          className={`flex items-center gap-2 pb-3 text-xs font-semibold transition-all border-b-2 ${
            activeTab === "buildings"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Building2 className="size-4" />
          <span>Buildings ({buildings.length})</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="flex items-center justify-between gap-4">
        <div className="w-full sm:max-w-sm">
          <SearchInput
            value={searchTerm}
            onChange={(val) => {
              setSearchTerm(val);
              setPage(1);
            }}
            placeholder={`Search ${activeTab}...`}
          />
        </div>
      </div>

      {/* TAB 1: Storage Units & Shelves */}
      {activeTab === "units" && (
        <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-2xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-[120px] font-semibold text-xs">Code</TableHead>
                <TableHead className="font-semibold text-xs">Storage Unit</TableHead>
                <TableHead className="font-semibold text-xs">Type</TableHead>
                <TableHead className="hidden md:table-cell font-semibold text-xs">
                  Assigned Room
                </TableHead>
                <TableHead className="hidden sm:table-cell font-semibold text-xs">
                  Description
                </TableHead>
                {can("location.delete") && (
                  <TableHead className="w-[70px] text-right font-semibold text-xs">
                    Actions
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoadingUnits ? (
                <TableLoading colSpan={6} />
              ) : stockLocations.length === 0 ? (
                <TableEmpty colSpan={6} />
              ) : (
                stockLocations.map((unit) => (
                  <TableRow key={unit.id} className="hover:bg-muted/30">
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {unit.code}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Archive className="size-4 text-primary shrink-0" />
                        <span className="font-medium text-sm text-foreground">
                          {unit.name}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="secondary" className="text-xs font-normal">
                        {unit.type}
                      </Badge>
                    </TableCell>

                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {unit.room?.name || "—"}
                    </TableCell>

                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground max-w-xs truncate">
                      {unit.description || "—"}
                    </TableCell>

                    {can("location.delete") && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDelete(unit.id, unit.name, "unit")}
                          className="size-8 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* TAB 2: Rooms & Labs */}
      {activeTab === "rooms" && (
        <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-2xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-[120px] font-semibold text-xs">Code</TableHead>
                <TableHead className="font-semibold text-xs">Room / Lab Name</TableHead>
                <TableHead className="font-semibold text-xs">Status</TableHead>
                <TableHead className="hidden md:table-cell font-semibold text-xs">
                  Capacity
                </TableHead>
                <TableHead className="hidden sm:table-cell font-semibold text-xs">
                  Description
                </TableHead>
                {can("location.delete") && (
                  <TableHead className="w-[70px] text-right font-semibold text-xs">
                    Actions
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoadingRooms ? (
                <TableLoading colSpan={6} />
              ) : rooms.length === 0 ? (
                <TableEmpty colSpan={6} />
              ) : (
                rooms.map((room) => (
                  <TableRow key={room.id} className="hover:bg-muted/30">
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {room.code}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DoorOpen className="size-4 text-primary shrink-0" />
                        <span className="font-medium text-sm text-foreground">
                          {room.name}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={room.status === "ACTIVE" ? "default" : "secondary"}
                        className="text-xs font-normal"
                      >
                        {room.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground font-mono">
                      {room.capacity ? `${room.capacity} seats` : "—"}
                    </TableCell>

                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground max-w-xs truncate">
                      {room.description || "—"}
                    </TableCell>

                    {can("location.delete") && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDelete(room.id, room.name, "room")}
                          className="size-8 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* TAB 3: Buildings */}
      {activeTab === "buildings" && (
        <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-2xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-[120px] font-semibold text-xs">Code</TableHead>
                <TableHead className="font-semibold text-xs">Building Name</TableHead>
                <TableHead className="hidden md:table-cell font-semibold text-xs">
                  Campus Address
                </TableHead>
                <TableHead className="hidden sm:table-cell font-semibold text-xs">
                  Description
                </TableHead>
                {can("location.delete") && (
                  <TableHead className="w-[70px] text-right font-semibold text-xs">
                    Actions
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoadingBuildings ? (
                <TableLoading colSpan={5} />
              ) : buildings.length === 0 ? (
                <TableEmpty colSpan={5} />
              ) : (
                buildings.map((b) => (
                  <TableRow key={b.id} className="hover:bg-muted/30">
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {b.code}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="size-4 text-primary shrink-0" />
                        <span className="font-medium text-sm text-foreground">
                          {b.name}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground flex items-center gap-1.5">
                      {b.address && <MapPin className="size-3 text-muted-foreground shrink-0" />}
                      <span>{b.address || "—"}</span>
                    </TableCell>

                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground max-w-xs truncate">
                      {b.description || "—"}
                    </TableCell>

                    {can("location.delete") && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDelete(b.id, b.name, "building")}
                          className="size-8 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modals */}
      <BuildingModal
        open={buildingModalOpen}
        onOpenChange={setBuildingModalOpen}
      />
      <RoomModal open={roomModalOpen} onOpenChange={setRoomModalOpen} />
      <StockLocationModal
        open={stockLocationModalOpen}
        onOpenChange={setStockLocationModalOpen}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]">
          <DialogHeader className="p-5 pb-3 border-b bg-card shrink-0">
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="size-5" />
              Confirm Deletion
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-5 text-xs text-muted-foreground">
            Are you sure you want to delete{" "}
            <strong className="text-foreground">
              "{itemToDelete?.name}"
            </strong>
            ? This action cannot be undone.
          </div>

          <DialogFooter className="p-4 border-t bg-card shrink-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Yes, Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
