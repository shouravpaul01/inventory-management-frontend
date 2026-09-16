"use client";

import { useState } from "react";
import { ScrollText, Download, Filter, ShieldCheck, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionHeader from "@/components/shared/SectionHeader";
import SearchInput from "@/components/shared/SearchInput";
import FilterSelect from "@/components/shared/FilterSelect";
import Pagination from "@/components/shared/Pagination";
import AuditTable from "@/components/audit/AuditTable";
import AuditDetailsModal from "@/components/audit/AuditDetailsModal";
import { useGetAuditLogsQuery } from "@/redux/api/auditApi";
import { useDebounce } from "@/hooks/useDebounce";
import { usePermission } from "@/hooks/usePermission";
import { TAuditLog } from "@/type";
import { toast } from "sonner";
import PermissionGuard from "@/components/shared/PermissionGuard";

export default function AuditLogsPage() {
  const { can } = usePermission();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);

  const [moduleFilter, setModuleFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<TAuditLog | null>(null);

  const { data, isLoading } = useGetAuditLogsQuery(
    {
      searchTerm: debouncedSearch || undefined,
      module: moduleFilter || undefined,
      action: actionFilter || undefined,
      page,
      limit,
      sortBy: "createdAt",
      sortOrder: "desc",
    },
    { skip: !can("audit.view") }
  );

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
    <PermissionGuard permission="audit.view">
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

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Module Filter */}
          <div className="w-full sm:w-48">
            <FilterSelect
              placeholder="Module"
              value={moduleFilter}
              onChange={(val) => {
                setModuleFilter(val);
                setPage(1);
              }}
              options={[
                { label: "Stock", value: "Stock" },
                { label: "Requisition", value: "Requisition" },
                { label: "Distribution", value: "Distribution" },
                { label: "Return", value: "Return" },
                { label: "Approval", value: "Approval" },
                { label: "Inventory Items", value: "InventoryItem" },
                { label: "Asset Units", value: "InventoryUnit" },
                { label: "Locations", value: "Location" },
                { label: "Departments", value: "Department" },
                { label: "User & Auth", value: "User" },
                { label: "RBAC", value: "RBAC" },
              ]}
              includeAllOption
              allLabel="All Modules"
            />
          </div>

          {/* Action Filter */}
          <div className="w-full sm:w-44">
            <FilterSelect
              placeholder="Action"
              value={actionFilter}
              onChange={(val) => {
                setActionFilter(val);
                setPage(1);
              }}
              options={[
                { label: "CREATE", value: "CREATE" },
                { label: "UPDATE", value: "UPDATE" },
                { label: "DELETE", value: "DELETE" },
                { label: "LOGIN", value: "LOGIN" },
                { label: "STOCK IN", value: "STOCK_IN" },
                { label: "STOCK OUT", value: "STOCK_OUT" },
                { label: "TRANSFER", value: "TRANSFER" },
                { label: "ADJUST", value: "ADJUST" },
                { label: "APPROVE", value: "APPROVE" },
                { label: "REJECT", value: "REJECT" },
                { label: "DISTRIBUTE", value: "DISTRIBUTE" },
                { label: "RETURN", value: "RETURN" },
              ]}
              includeAllOption
              allLabel="All Actions"
            />
          </div>

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
              className="text-xs h-11 px-3 text-muted-foreground hover:text-foreground gap-1.5 shrink-0"
            >
              <RotateCcw className="size-3.5" />
              <span>Reset</span>
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
    </PermissionGuard>
  );
}
