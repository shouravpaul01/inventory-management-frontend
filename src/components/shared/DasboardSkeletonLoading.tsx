"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardSkeletonLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-48 rounded-lg" />
        <Skeleton className="h-4 w-72 rounded-md" />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border bg-card p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-9 w-20 rounded-md" />
                <Skeleton className="h-3 w-28 rounded-md" />
              </div>

              <Skeleton className="size-12 rounded-xl" />
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5 md:flex-row md:items-center md:justify-between">
        <Skeleton className="h-11 w-full md:w-96 rounded-lg" />

        <div className="flex gap-3">
          <Skeleton className="h-11 w-44 rounded-lg" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border bg-card">
        {/* Table Header */}
        <div className="grid grid-cols-6 gap-6 border-b bg-muted/40 px-6 py-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-4 w-24 rounded-md"
            />
          ))}
        </div>

        {/* Table Rows */}
        {Array.from({ length: 8 }).map((_, row) => (
          <div
            key={row}
            className="grid grid-cols-6 items-center gap-6 border-b px-6 py-5 last:border-0"
          >
            {/* User */}
            <div className="flex items-center gap-3">
              <Skeleton className="size-11 rounded-full" />

              <div className="space-y-2">
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-3 w-20 rounded-md" />
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-40 rounded-md" />
              <Skeleton className="h-4 w-32 rounded-md" />
            </div>

            {/* Wallet */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-20 rounded-md" />
              <Skeleton className="h-3 w-24 rounded-md" />
            </div>

            {/* Status */}
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-10 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>

            {/* Joined */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-3 w-28 rounded-md" />
            </div>

            {/* Action */}
            <div className="flex justify-end">
              <Skeleton className="h-9 w-24 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-60 rounded-lg" />

        <Skeleton className="h-10 w-72 rounded-lg" />
      </div>
    </div>
  );
}