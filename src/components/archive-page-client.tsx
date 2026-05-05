"use client";

import { ArchiveOrderCard } from "@/components/archive-order-card";
import { ArchivePagination } from "@/components/archive-pagination";
import { ArchiveSearchInput } from "@/components/archive-search-input";
import type { SerializedOrder } from "@/lib/serialize-order";

interface ArchivePageClientProps {
  orders: SerializedOrder[];
  page: number;
  totalPages: number;
  total: number;
  query: string;
}

export function ArchivePageClient({
  orders,
  page,
  totalPages,
  total,
  query,
}: ArchivePageClientProps) {
  return (
    <div className="space-y-4">
      <ArchiveSearchInput defaultValue={query} />

      {orders.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No matches.
        </p>
      ) : (
        <ul className="grid gap-6 lg:grid-cols-2">
          {orders.map((order) => (
            <li key={order._id}>
              <ArchiveOrderCard order={order} />
            </li>
          ))}
        </ul>
      )}

      <ArchivePagination
        page={page}
        totalPages={totalPages}
        total={total}
        query={query}
      />
    </div>
  );
}
