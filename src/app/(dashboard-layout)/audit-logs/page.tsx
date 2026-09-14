"use client";

import { useState } from "react";
import { ScrollText, Download, Filter, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionHeader from "@/components/shared/SectionHeader";
import SearchInput from "@/components/shared/SearchInput";
import Pagination from "@/components/shared/Pagination";
import AuditTable from "@/components/audit/AuditTable";
import AuditDetailsModal from "@/components/audit/AuditDetailsModal";
import { useGetAuditLogsQuery } from "@/redux/api/auditApi";
import { useDebounce } from "@/hooks/useDebounce";
import { TAuditLog } from "@/type";
import { toast } from "sonner";

export default function AuditLogsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);

  const [moduleFilter, setModuleFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<TAuditLog | null>(null);

  const { data, isLoading } = useGetAuditLogsQuery({
    searchTerm: debouncedSearch || undefined,
    module: moduleFilter || undefined,
    action: actionFilter || undefined,
    page,
    limit,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const logs = data?.data || [];
  const meta = data?.meta || {
    page: 1,
    limit: 15,
    total: 0,
    totalPage: 1,
  };

  const handleViewDetails = (log: TAuditLog) => {
    setSelectedLog(log);
    setDetailsModalOpen(true);
  };

  const handleExportCSV = () => {
    if (logs.length === 0) {
      toast.error("No audit logs available to export.");
      return;
    }

    const headers = ["Timestamp", "Action", "Module", "EntityType", "EntityId", "Actor", "IP"];
    const rows = logs.map((l) => [
      new Date(l.createdAt).toISOString(),
      l.action,
      l.module,
      l.entityType,
      l.entityId || "",
      l.actor ? `${l.actor.firstName} ${l.actor.lastName} (${l.actor.email})` : "System",
      l.ipAddress || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit-trail-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Audit trail exported to CSV.");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <SectionHeader
          title="Audit Logs & Compliance Trail"
          description="Immutable record of security events, inventory mutations, approval sign-offs, and administrative actions."
        />

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          className="gap-1.5 text-xs shadow-xs"
        >
          <Download className="size-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex-1">
          <SearchInput
            placeholder="Search by module, entity type, or ID..."
            value={searchTerm}
            onChange={(val) => {
              setSearchTerm(val);
              setPage(1);
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Module Filter */}
          <select
            value={moduleFilter}
            onChange={(e) => {
              setModuleFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by Module"
            className="h-9 px-3 text-xs rounded-md border border-input bg-background focus:outline-hidden focus:ring-1 focus:ring-ring"
          >
            <option value="">All Modules</option>
            <option value="Stock">Stock</option>
            <option value="Requisition">Requisition</option>
            <option value="Distribution">Distribution</option>
            <option value="Return">Return</option>
            <option value="Approval">Approval</option>
            <option value="InventoryItem">Inventory Items</option>
            <option value="InventoryUnit">Asset Units</option>
            <option value="Location">Locations</option>
            <option value="Department">Departments</option>
            <option value="User">User & Auth</option>
            <option value="RBAC">RBAC</option>
          </select>

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by Action"
            className="h-9 px-3 text-xs rounded-md border border-input bg-background focus:outline-hidden focus:ring-1 focus:ring-ring"
          >
            <option value="">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="LOGIN">LOGIN</option>
            <option value="STOCK_IN">STOCK IN</option>
            <option value="STOCK_OUT">STOCK OUT</option>
            <option value="TRANSFER">TRANSFER</option>
            <option value="ADJUST">ADJUST</option>
            <option value="APPROVE">APPROVE</option>
            <option value="REJECT">REJECT</option>
            <option value="DISTRIBUTE">DISTRIBUTE</option>
            <option value="RETURN">RETURN</option>
          </select>

          {(searchTerm || moduleFilter || actionFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setModuleFilter("");
                setActionFilter("");
                setPage(1);
              }}
              className="text-xs h-9"
            >
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* Audit Table */}
      <AuditTable
        logs={logs}
        isLoading={isLoading}
        onViewDetails={handleViewDetails}
      />

      {/* Pagination */}
      {!isLoading && logs.length > 0 && (
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

      {/* Details Modal */}
      <AuditDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        log={selectedLog}
      />
    </div>
  );
}
