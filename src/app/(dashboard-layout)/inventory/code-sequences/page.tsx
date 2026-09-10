"use client";

import React, { useState, useMemo } from "react";
import {
  Hash,
  Plus,
  Edit2,
  Search,
  Loader2,
  Sparkles,
  CheckCircle2,
  Sliders,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { PermissionGate } from "@/components/shared/permissions/PermissionGate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useGetAllCodeSequencesQuery,
  useCreateCodeSequenceMutation,
  useUpdateCodeSequenceMutation,
} from "@/redux/api/inventoryApi";
import { ICodeSequence } from "@/types";
import { toast } from "sonner";

export default function CodeSequencesPage() {
  const { data: seqRes, isLoading, refetch } = useGetAllCodeSequencesQuery();
  const sequences = useMemo(() => seqRes?.data || [], [seqRes]);

  const [createSeq, { isLoading: isCreating }] = useCreateCodeSequenceMutation();
  const [updateSeq, { isLoading: isUpdating }] = useUpdateCodeSequenceMutation();

  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSeq, setEditingSeq] = useState<ICodeSequence | null>(null);

  const [form, setForm] = useState({
    name: "",
    code: "",
    prefix: "AST",
    separator: "-",
    startNumber: 1,
    paddingLength: 6,
    yearIncluded: true,
    monthIncluded: false,
    isActive: true,
  });

  // Calculate live preview
  const livePreview = useMemo(() => {
    const parts: string[] = [form.prefix.toUpperCase() || "PREFIX"];
    const now = new Date();
    if (form.yearIncluded) {
      parts.push(now.getFullYear().toString());
    }
    if (form.monthIncluded) {
      parts.push(String(now.getMonth() + 1).padStart(2, "0"));
    }
    const padded = String(form.startNumber || 1).padStart(form.paddingLength || 6, "0");
    parts.push(padded);
    return parts.join(form.separator);
  }, [form]);

  const handleOpenCreate = () => {
    setForm({
      name: "",
      code: "",
      prefix: "AST",
      separator: "-",
      startNumber: 1,
      paddingLength: 6,
      yearIncluded: true,
      monthIncluded: false,
      isActive: true,
    });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (seq: ICodeSequence) => {
    setEditingSeq(seq);
    setForm({
      name: seq.name,
      code: seq.code,
      prefix: seq.prefix,
      separator: seq.separator || "-",
      startNumber: seq.startNumber || 1,
      paddingLength: (seq as any).paddingLength || (seq as any).padding || 6,
      yearIncluded: (seq as any).yearIncluded ?? seq.includeYear ?? false,
      monthIncluded: (seq as any).monthIncluded ?? seq.includeMonth ?? false,
      isActive: seq.isActive,
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim() || !form.prefix.trim()) {
      toast.error("Sequence name, unique code, and prefix are required.");
      return;
    }

    try {
      await createSeq({
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        prefix: form.prefix.trim().toUpperCase(),
        separator: form.separator,
        startNumber: Number(form.startNumber),
        paddingLength: Number(form.paddingLength),
        yearIncluded: form.yearIncluded,
        monthIncluded: form.monthIncluded,
        isActive: form.isActive,
      }).unwrap();
      toast.success("Code sequence generator created.");
      setIsCreateOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create code sequence.");
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSeq) return;

    try {
      await updateSeq({
        id: editingSeq.id,
        body: {
          name: form.name.trim(),
          prefix: form.prefix.trim().toUpperCase(),
          separator: form.separator,
          paddingLength: Number(form.paddingLength),
          yearIncluded: form.yearIncluded,
          monthIncluded: form.monthIncluded,
          isActive: form.isActive,
        },
      }).unwrap();
      toast.success("Code sequence updated.");
      setEditingSeq(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update code sequence.");
    }
  };

  const filteredSequences = useMemo(() => {
    return sequences.filter(
      (s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.code.toLowerCase().includes(search.toLowerCase()) ||
        s.prefix.toLowerCase().includes(search.toLowerCase())
    );
  }, [sequences, search]);

  const columns: Column<ICodeSequence>[] = [
    {
      key: "code",
      header: "Code & Prefix",
      render: (item) => (
        <div>
          <div className="flex items-center gap-2">
            <code className="text-xs font-mono font-bold bg-muted px-2 py-0.5 rounded border text-foreground">
              {item.code}
            </code>
            <Badge variant="outline" className="text-xs font-mono">
              Prefix: {item.prefix}
            </Badge>
          </div>
          <span className="text-sm font-semibold text-foreground mt-0.5 block">
            {item.name}
          </span>
        </div>
      ),
    },
    {
      key: "formatPreview",
      header: "Format Schema Preview",
      render: (item) => {
        const parts = [item.prefix];
        const now = new Date();
        const sep = item.separator || "-";
        const yr = (item as any).yearIncluded ?? item.includeYear;
        const mo = (item as any).monthIncluded ?? item.includeMonth;
        const pad = (item as any).paddingLength || item.padding || 6;

        if (yr) parts.push(now.getFullYear().toString());
        if (mo) parts.push(String(now.getMonth() + 1).padStart(2, "0"));
        parts.push(String(item.currentNumber || item.startNumber || 1).padStart(pad, "0"));

        return (
          <code className="text-xs font-mono font-bold bg-primary/10 text-primary px-2.5 py-1 rounded border border-primary/20 select-all">
            {parts.join(sep)}
          </code>
        );
      },
    },
    {
      key: "currentCounter",
      header: "Current Index",
      render: (item) => (
        <div className="text-xs space-y-0.5 font-mono">
          <div>Next: #{item.currentNumber || item.startNumber || 1}</div>
          <div className="text-muted-foreground text-[11px]">
            Pad length: {(item as any).paddingLength || item.padding || 6} digits
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item) => (
        <Badge
          variant={item.isActive ? "default" : "secondary"}
          className={item.isActive ? "bg-emerald-600 hover:bg-emerald-700" : ""}
        >
          {item.isActive ? "ACTIVE" : "INACTIVE"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (item) => (
        <PermissionGate permissions={["code_sequence.manage"]}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => handleOpenEdit(item)}
            title="Edit Generator"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
        </PermissionGate>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Asset Code Sequences"
        description="Automatic barcode, SKU, and QR code sequence generators that formulate structured institutional asset tags."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Inventory", href: "/inventory" },
          { label: "Code Sequences" },
        ]}
      >
        <PermissionGate permissions={["code_sequence.manage"]}>
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="w-4 h-4" /> Add Code Sequence
          </Button>
        </PermissionGate>
      </PageHeader>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Sequences
            </CardTitle>
            <Hash className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sequences.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Registered tag formula generators
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Generators
            </CardTitle>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sequences.filter((s) => s.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently available for auto-tagging
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Search Matches
            </CardTitle>
            <Sliders className="w-4 h-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredSequences.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Sequences matching search criteria
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table Card */}
      <Card className="border shadow-sm">
        <div className="p-4 border-b flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search sequences by name or prefix..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Badge variant="secondary" className="text-xs shrink-0">
            {filteredSequences.length} {filteredSequences.length === 1 ? "Sequence" : "Sequences"}
          </Badge>
        </div>

        <DataTable
          columns={columns}
          data={filteredSequences}
          isLoading={isLoading}
          emptyTitle="No code sequences found"
          emptyDescription="Create your first automatic code sequence using the button above."
        />
      </Card>

      {/* Create Modal with Live Preview */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader>
              <DialogTitle>Add Asset Code Sequence</DialogTitle>
              <DialogDescription>
                Configure an institutional numbering schema for serialized equipment.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
              {/* Interactive Live Preview Box */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-1 text-center">
                <span className="text-[11px] font-semibold text-primary uppercase tracking-wider flex items-center justify-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Sample Generated Code
                </span>
                <div className="text-lg font-mono font-bold text-foreground select-all py-1">
                  {livePreview}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Updates dynamically as you adjust prefix, dates, and number padding
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="seq-code" className="text-xs font-semibold">
                    Sequence Identifier <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="seq-code"
                    placeholder="e.g. SERIAL_ASSET_TAG"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="uppercase font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="seq-name" className="text-xs font-semibold">
                    Friendly Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="seq-name"
                    placeholder="e.g. Department Asset Tag"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="seq-prefix" className="text-xs font-semibold">
                    Prefix <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="seq-prefix"
                    placeholder="e.g. AST, CS-LAB"
                    value={form.prefix}
                    onChange={(e) => setForm({ ...form, prefix: e.target.value })}
                    className="uppercase font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="seq-sep" className="text-xs font-semibold">
                    Separator
                  </Label>
                  <Input
                    id="seq-sep"
                    placeholder="e.g. -"
                    value={form.separator}
                    onChange={(e) => setForm({ ...form, separator: e.target.value })}
                    className="font-mono text-center"
                    maxLength={2}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="seq-start" className="text-xs font-semibold">
                    Start Counter
                  </Label>
                  <Input
                    id="seq-start"
                    type="number"
                    min={1}
                    value={form.startNumber}
                    onChange={(e) => setForm({ ...form, startNumber: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="seq-pad" className="text-xs font-semibold">
                    Padding Digits (2-10)
                  </Label>
                  <Input
                    id="seq-pad"
                    type="number"
                    min={2}
                    max={10}
                    value={form.paddingLength}
                    onChange={(e) => setForm({ ...form, paddingLength: Number(e.target.value) })}
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold">Include Current Year</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Appends current year (e.g. {new Date().getFullYear()})
                    </p>
                  </div>
                  <Switch
                    checked={form.yearIncluded}
                    onCheckedChange={(val) => setForm({ ...form, yearIncluded: val })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold">Include Current Month</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Appends 2-digit month (e.g. {String(new Date().getMonth() + 1).padStart(2, "0")})
                    </p>
                  </div>
                  <Switch
                    checked={form.monthIncluded}
                    onCheckedChange={(val) => setForm({ ...form, monthIncluded: val })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold">Status Active</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Enable for automatic asset generation
                    </p>
                  </div>
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(val) => setForm({ ...form, isActive: val })}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating...
                  </>
                ) : (
                  "Create Sequence"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editingSeq} onOpenChange={(open) => !open && setEditingSeq(null)}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleUpdateSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Code Sequence</DialogTitle>
              <DialogDescription>
                Update generator rules for {editingSeq?.code}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-1 text-center">
                <span className="text-[11px] font-semibold text-primary uppercase tracking-wider flex items-center justify-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Sample Generated Code
                </span>
                <div className="text-lg font-mono font-bold text-foreground select-all py-1">
                  {livePreview}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Sequence Identifier</Label>
                  <Input value={editingSeq?.code || ""} disabled className="bg-muted font-mono" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-seq-name" className="text-xs font-semibold">
                    Friendly Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-seq-name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-seq-prefix" className="text-xs font-semibold">
                    Prefix <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-seq-prefix"
                    value={form.prefix}
                    onChange={(e) => setForm({ ...form, prefix: e.target.value })}
                    className="uppercase font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-seq-sep" className="text-xs font-semibold">
                    Separator
                  </Label>
                  <Input
                    id="edit-seq-sep"
                    value={form.separator}
                    onChange={(e) => setForm({ ...form, separator: e.target.value })}
                    className="font-mono text-center"
                    maxLength={2}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-seq-pad" className="text-xs font-semibold">
                  Padding Digits (2-10)
                </Label>
                <Input
                  id="edit-seq-pad"
                  type="number"
                  min={2}
                  max={10}
                  value={form.paddingLength}
                  onChange={(e) => setForm({ ...form, paddingLength: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold">Include Current Year</Label>
                  </div>
                  <Switch
                    checked={form.yearIncluded}
                    onCheckedChange={(val) => setForm({ ...form, yearIncluded: val })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold">Include Current Month</Label>
                  </div>
                  <Switch
                    checked={form.monthIncluded}
                    onCheckedChange={(val) => setForm({ ...form, monthIncluded: val })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold">Status Active</Label>
                  </div>
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(val) => setForm({ ...form, isActive: val })}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingSeq(null)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
