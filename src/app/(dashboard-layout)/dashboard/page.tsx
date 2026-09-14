"use client";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePermission } from "@/hooks/usePermission";
import {
  Boxes,
  Package,
  FileText,
  SendHorizontal,
  RotateCcw,
  CheckSquare,
  ShieldCheck,
  Building2,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const { user, isSuperAdmin, department } = useCurrentUser();
  const { can } = usePermission();

  const quickActions = [
    {
      title: "New Requisition",
      desc: "Submit a request for items or assets",
      href: "/requisitions/new",
      icon: <FileText className="size-5 text-blue-600" />,
      permission: "requisition.create",
    },
    {
      title: "Pending Approvals",
      desc: "Review requests awaiting your sign-off",
      href: "/approvals",
      icon: <CheckSquare className="size-5 text-amber-600" />,
      permission: "requisition.approve",
    },
    {
      title: "Browse Item Catalog",
      desc: "Check available department inventory items",
      href: "/inventory",
      icon: <Package className="size-5 text-emerald-600" />,
      permission: "inventory.view",
    },
    {
      title: "Active Distributions",
      desc: "Track item dispatches and deliveries",
      href: "/distributions",
      icon: <SendHorizontal className="size-5 text-purple-600" />,
      permission: "distribution.view",
    },
    {
      title: "Returns & Restocking",
      desc: "Manage asset returns and damaged equipment",
      href: "/returns",
      icon: <RotateCcw className="size-5 text-rose-600" />,
      permission: "return.view",
    },
    {
      title: "Department Locations",
      desc: "View store rooms, cabinets, and bins",
      href: "/locations",
      icon: <Building2 className="size-5 text-indigo-600" />,
      permission: "location.view",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white shadow-sm border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-indigo-300">
                University Inventory Portal
              </span>
              {isSuperAdmin && (
                <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[11px]">
                  Super Admin
                </Badge>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Welcome back, {user?.firstName || "Faculty Member"}! 👋
            </h1>

            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              {department ? (
                <>Assigned Department: <span className="font-semibold text-white">{department.name}</span> ({department.code})</>
              ) : (
                "Manage items, review requisitions, and track inventory movements seamlessly."
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {can("requisition.create") && (
              <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs shadow">
                <Link href="/requisitions/new">
                  <FileText className="size-4 mr-1.5" />
                  Create Requisition
                </Link>
              </Button>
            )}
            {can("inventory.view") && (
              <Button asChild variant="outline" className="border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-white text-xs">
                <Link href="/inventory">
                  <Boxes className="size-4 mr-1.5" />
                  View Stock
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Access Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Quick Actions & Workflows
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {quickActions
            .filter((action) => !action.permission || can(action.permission))
            .map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="group relative flex items-start gap-3.5 rounded-xl border border-border/60 bg-card p-4 shadow-xs transition-all hover:border-border hover:shadow-sm hover:bg-accent/30"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted group-hover:bg-background transition-colors">
                  {action.icon}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {action.title}
                    </span>
                    <ArrowRight className="size-3.5 text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    {action.desc}
                  </p>
                </div>
              </Link>
            ))}
        </div>
      </div>

      {/* System Status / Security Notice */}
      <div className="rounded-xl border border-border/60 bg-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
          <span>Session active with institutional access control & audit logging.</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span>Role: {user?.roles?.[0] || "Staff"}</span>
          <span>•</span>
          <span>Status: {user?.status || "ACTIVE"}</span>
        </div>
      </div>
    </div>
  );
}
