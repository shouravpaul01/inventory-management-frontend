"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TableEmpty from "@/components/shared/TableEmpty";
import TableLoading from "@/components/shared/TableLoading";
import { TInventoryUnit, TUnitCondition, TUnitStatus } from "@/type";
import {
  QrCode,
  Edit,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  XCircle,
  Clock,
} from "lucide-react";
import { usePermission } from "@/hooks/usePermission";

interface UnitTableProps {
  units: TInventoryUnit[];
  isLoading: boolean;
  onEdit: (unit: TInventoryUnit) => void;
}

export default function UnitTable({
  units,
  isLoading,
  onEdit,
}: UnitTableProps) {
  const { can } = usePermission();
  const canUpdate = can("inventory_unit.update");

  const getStatusBadge = (status: TUnitStatus) => {
    switch (status) {
      case "AVAILABLE":
        return (
          <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600 text-[10px] gap-1">
            <CheckCircle2 className="size-2.5" />
            Available
          </Badge>
        );
      case "ALLOCATED":
      case "ISSUED":
        return (
          <Badge variant="secondary" className="bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 text-[10px] gap-1">
            <Clock className="size-2.5" />
            In Use
          </Badge>
        );
      case "MAINTENANCE":
      case "UNDER_REPAIR":
        return (
          <Badge variant="secondary" className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 text-[10px] gap-1">
            <Wrench className="size-2.5" />
            Repair
          </Badge>
        );
      case "DAMAGED":
        return (
          <Badge variant="destructive" className="text-[10px] gap-1">
            <AlertTriangle className="size-2.5" />
            Damaged
          </Badge>
        );
      case "DISPOSED":
      case "LOST":
        return (
          <Badge variant="outline" className="text-[10px] text-muted-foreground gap-1">
            <XCircle className="size-2.5" />
            {status}
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  const getConditionBadge = (condition: TUnitCondition) => {
    switch (condition) {
      case "NEW":
        return (
          <Badge variant="outline" className="text-emerald-700 border-emerald-600/40 text-[10px]">
            New
          </Badge>
        );
      case "GOOD":
        return (
          <Badge variant="outline" className="text-blue-700 border-blue-600/40 text-[10px]">
            Good
          </Badge>
        );
      case "FAIR":
        return (
          <Badge variant="outline" className="text-amber-700 border-amber-600/40 text-[10px]">
            Fair
          </Badge>
        );
      case "POOR":
      case "DAMAGED":
        return (
          <Badge variant="outline" className="text-rose-700 border-rose-600/40 text-[10px]">
            {condition}
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-[10px]">{condition}</Badge>;
    }
  };

  return (
    <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-2xs">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="w-[140px] font-semibold text-xs">Asset Barcode</TableHead>
            <TableHead className="font-semibold text-xs">Item Model</TableHead>
            <TableHead className="hidden md:table-cell font-semibold text-xs">
              Serial / RFID
            </TableHead>
            <TableHead className="w-[100px] font-semibold text-xs">Condition</TableHead>
            <TableHead className="w-[110px] font-semibold text-xs">Status</TableHead>
            <TableHead className="hidden sm:table-cell font-semibold text-xs">
              Location
            </TableHead>
            {canUpdate && (
              <TableHead className="w-[70px] text-right font-semibold text-xs">
                Actions
              </TableHead>
            )}
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading ? (
            <TableLoading colSpan={7} />
          ) : units.length === 0 ? (
            <TableEmpty colSpan={7} />
          ) : (
            units.map((unit) => (
              <TableRow key={unit.id} className="hover:bg-muted/30">
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <QrCode className="size-3.5 text-primary shrink-0" />
                    <Badge variant="outline" className="font-mono text-xs">
                      {unit.uniqueCode}
                    </Badge>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium text-xs text-foreground truncate">
                      {unit.inventoryItem?.name || "Asset Item"}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground truncate">
                      {unit.inventoryItem?.code || "—"}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="hidden md:table-cell text-xs font-mono text-muted-foreground">
                  {unit.serialNumber || unit.barcode || "—"}
                </TableCell>

                <TableCell>{getConditionBadge(unit.condition)}</TableCell>

                <TableCell>{getStatusBadge(unit.status)}</TableCell>

                <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                  {unit.location ? (
                    <div className="flex items-center gap-1">
                      <MapPin className="size-3 text-muted-foreground shrink-0" />
                      <span className="truncate max-w-[130px]">{unit.location.name}</span>
                    </div>
                  ) : (
                    "—"
                  )}
                </TableCell>

                {canUpdate && (
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(unit)}
                      className="size-8 text-muted-foreground hover:text-foreground"
                    >
                      <Edit className="size-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
