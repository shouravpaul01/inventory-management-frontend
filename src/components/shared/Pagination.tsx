"use client";

import {
  Pagination as ShadcnPagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalData?: number;
  limit: number;
  onLimitChange: (limit: number) => void;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalData,
  limit,
  onLimitChange,
  onPageChange,
}: PaginationProps) {
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, "ellipsis", totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(
        1,
        "ellipsis",
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages
      );
    } else {
      pages.push(
        1,
        "ellipsis",
        currentPage - 1,
        currentPage,
        currentPage + 1,
        "ellipsis",
        totalPages
      );
    }

    return pages;
  };

  if (totalPages <= 1 && !totalData) return null;

  const from = totalData ? (currentPage - 1) * limit + 1 : 0;
  const to = totalData
    ? Math.min(currentPage * limit, totalData)
    : 0;

  return (
    <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      {/* Left */}
      <div className="flex  items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Show
          </span>

          <Select
            value={String(limit)}
            onValueChange={(value) =>
              onLimitChange(Number(value))
            }
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>

          <span className="text-sm text-muted-foreground">
            entries
          </span>
        </div>

        {totalData !== undefined && (
          <p className="hidden md:block whitespace-nowrap text-sm text-muted-foreground">
            Showing <strong>{from}</strong> - <strong>{to}</strong> of{" "}
            <strong>{totalData}</strong>
          </p>
        )}
      </div>

      {/* Right */}
      {totalPages > 1 && (
        <ShadcnPagination className="justify-end">
          <PaginationContent className="gap-2">
            {/* Previous */}
            <PaginationItem>
              <PaginationPrevious
                onClick={() =>
                  currentPage > 1 &&
                  onPageChange(currentPage - 1)
                }
                className={`transition-all h-10 ${currentPage === 1
                  ? "pointer-events-none opacity-40"
                  : "cursor-pointer border bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                  }`}
              />
            </PaginationItem>

            {/* Page Numbers */}
            {getPageNumbers().map((page, index) =>
              page === "ellipsis" ? (
                <PaginationItem key={index}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={page}>
                  <PaginationLink
                    isActive={currentPage === page}
                    onClick={() => onPageChange(page)}
                    className={`cursor-pointer transition-all h-10 ${currentPage === page
                      ? "border bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                      : "hover:bg-primary/10"
                      }`}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              )
            )}

            {/* Next */}
            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  currentPage < totalPages &&
                  onPageChange(currentPage + 1)
                }
                className={`transition-all h-10 ${currentPage === totalPages
                  ? "pointer-events-none opacity-40"
                  : "cursor-pointer border bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                  }`}
              />
            </PaginationItem>
          </PaginationContent>
        </ShadcnPagination>
      )}
    </div>
  );
}