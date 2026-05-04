"use client";

import { OrderQueueCard } from "@/components/order-queue-card";
import { Input } from "@/components/ui/input";
import { orderMatchesQuery } from "@/lib/order-matches-query";
import type { SerializedOrder } from "@/lib/serialize-order";
import { useMemo, useState } from "react";

export function ParcelPageClient({ orders }: { orders: SerializedOrder[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => orders.filter((o) => orderMatchesQuery(o, query)),
    [orders, query],
  );

  return (
    <div className="space-y-4">
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name or last 4 digits"
        aria-label="Search orders"
      />

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No matches.
        </p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
          {filtered.map((order) => (
            <li key={order._id}>
              <OrderQueueCard order={order} variant="parcel" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

