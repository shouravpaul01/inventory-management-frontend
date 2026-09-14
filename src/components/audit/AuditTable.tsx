"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import TableEmpty from "@/components/shared/TableEmpty";
import TableLoading from "@/components/shared/TableLoading";
import { TAuditLog } from "@/type";
import {
  ScrollText,
  User,
  Globe,
  Eye,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

interface AuditTableProps {
  logs: TAuditLog[];
  isLoading: boolean;
  onViewDetails: (log: TAuditLog) => void;
}

export default function AuditTable({
  logs,
  isLoading,
  onViewDetails,
}: AuditTableProps) {
  const getActionBadge = (action: string) => {
    switch (action) {
      case "CREATE":
      case "STOCK_IN":
      case "APPROVE":
        return (
          <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600 text-[10px]">
            {action}
          </Badge>
        );
      case "UPDATE":
      case "TRANSFER":
      case "ADJUST":
        return (
          <Badge variant="secondary" className="bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 text-[10px]">
            {action}
          </Badge>
        );
      case "DELETE":
      case "REJECT":
      case "STOCK_OUT":
        return (
          <Badge variant="destructive" className="text-[10px]">
            {action}
          </Badge>
        );
      case "LOGIN":
      case "LOGOUT":
        return (
          <Badge variant="outline" className="text-purple-700 border-purple-400 text-[10px]">
            {action}
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-[10px]">{action}</Badge>;
    }
  };

  return (
    <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="font-semibold text-xs py-3.5">Timestamp</TableHead>
              <TableHead className="font-semibold text-xs py-3.5">Actor (User)</TableHead>
              <TableHead className="font-semibold text-xs py-3.5 text-center">Action</TableHead>
              <TableHead className="font-semibold text-xs py-3.5">Module & Entity</TableHead>
              <TableHead className="font-semibold text-xs py-3.5">Entity ID</TableHead>
              <TableHead className="font-semibold text-xs py-3.5">IP Address</TableHead>
              <TableHead className="font-semibold text-xs py-3.5 text-right">Payload</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableLoading colSpan={7} />
            ) : logs.length === 0 ? (
              <TableEmpty
                colSpan={7}
                message="No audit trail events recorded."
                description="System activities, user logins, data modifications, and state changes appear here."
              />
            ) : (
              logs.map((log) => {
                const actor = log.actor;
                const actorName = actor
                  ? `${actor.firstName} ${actor.lastName}`
                  : log.actorId
                  ? log.actorId.slice(-6)
                  : "System Automator";

                return (
                  <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="py-3 text-xs text-muted-foreground whitespace-nowrap font-mono">
                      {new Date(log.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </TableCell>

                    <TableCell className="py-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-xs font-medium text-foreground">
                          <User className="size-3 text-muted-foreground" />
                          <span>{actorName}</span>
                        </div>
                        {actor?.email && (
                          <p className="text-[11px] text-muted-foreground truncate max-w-xs">
                            {actor.email}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="py-3 text-center">
                      {getActionBadge(log.action)}
                    </TableCell>

                    <TableCell className="py-3">
                      <div className="flex items-center gap-1.5 text-xs font-medium">
                        <Badge variant="outline" className="text-[10px]">
                          {log.module}
                        </Badge>
                        <span className="text-muted-foreground">&rarr;</span>
                        <span className="text-foreground">{log.entityType}</span>
                      </div>
                    </TableCell>

                    <TableCell className="py-3 font-mono text-xs text-muted-foreground">
                      {log.entityId ? log.entityId.slice(-8) : "—"}
                    </TableCell>

                    <TableCell className="py-3 text-xs text-muted-foreground font-mono">
                      <div className="flex items-center gap-1">
                        <Globe className="size-3 text-muted-foreground" />
                        <span>{log.ipAddress || "127.0.0.1"}</span>
                      </div>
                    </TableCell>

                    <TableCell className="py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        title="View Change Diff & Details"
                        onClick={() => onViewDetails(log)}
                        className="hover:bg-muted"
                      >
                        <Eye className="size-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
