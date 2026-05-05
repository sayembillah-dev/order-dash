"use client";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface ArchivePaginationProps {
  page: number;
  totalPages: number;
  total: number;
  query: string;
}

export function ArchivePagination({
  page,
  totalPages,
  total,
  query,
}: ArchivePaginationProps) {
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function pageHref(n: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(n));
    if (query) {
      params.set("q", query);
    } else {
      params.delete("q");
    }
    return `?${params.toString()}`;
  }

  const PAGE_SIZE = 20;
  const start = (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);

  const pageNumbers = buildPageNumbers(page, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col items-center gap-3 pt-2"
    >
      <p className="text-sm text-muted-foreground">
        Showing {start}–{end} of {total} orders
      </p>

      <div className="flex items-center gap-1">
        {page <= 1 ? (
          <span
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "pointer-events-none opacity-50",
            )}
            aria-disabled="true"
          >
            <ChevronLeft className="size-4" />
            Prev
          </span>
        ) : (
          <Link
            href={pageHref(page - 1)}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <ChevronLeft className="size-4" />
            Prev
          </Link>
        )}

        {pageNumbers.map((item, i) =>
          item === "…" ? (
            <span
              key={`ellipsis-${i}`}
              className="px-1.5 text-sm text-muted-foreground"
            >
              …
            </span>
          ) : (
            <Link
              key={item}
              href={pageHref(item)}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                item === page && "border-primary bg-primary text-primary-foreground pointer-events-none",
              )}
              aria-current={item === page ? "page" : undefined}
            >
              {item}
            </Link>
          ),
        )}

        {page >= totalPages ? (
          <span
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "pointer-events-none opacity-50",
            )}
            aria-disabled="true"
          >
            Next
            <ChevronRight className="size-4" />
          </span>
        ) : (
          <Link
            href={pageHref(page + 1)}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Next
            <ChevronRight className="size-4" />
          </Link>
        )}
      </div>
    </nav>
  );
}

function buildPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "…")[] = [];

  // Always show first
  pages.push(1);

  if (current > 3) pages.push("…");

  // Window around current
  const windowStart = Math.max(2, current - 1);
  const windowEnd = Math.min(total - 1, current + 1);
  for (let i = windowStart; i <= windowEnd; i++) {
    pages.push(i);
  }

  if (current < total - 2) pages.push("…");

  // Always show last
  pages.push(total);

  return pages;
}
