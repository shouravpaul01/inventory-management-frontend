"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ProtectedRoute } from "@/components/shared/auth/ProtectedRoute";
import { DashboardHeader } from "@/components/shared/DashboardHeader";
import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <DashboardHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <div className="mx-auto max-w-7xl space-y-6">{children}</div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
