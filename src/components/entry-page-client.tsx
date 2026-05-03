"use client";

import { createPathaoBulkOrders, type PathaoBulkState } from "@/app/actions/pathao";
import { OrderQueueCard } from "@/components/order-queue-card";
import { usePathaoApi } from "@/components/pathao-api-provider";
import { Button } from "@/components/ui/button";
import type { SerializedOrder } from "@/lib/serialize-order";
import { Loader2 } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

export function EntryPageClient({ orders }: { orders: SerializedOrder[] }) {
  const { pathaoApiEnabled } = usePathaoApi();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkState, bulkAction, bulkPending] = useActionState(
    createPathaoBulkOrders,
    {} as PathaoBulkState,
  );

  useEffect(() => {
    if (bulkState?.error) {
      toast.error(bulkState.error);
    }
  }, [bulkState?.error]);

  useEffect(() => {
    if (bulkState?.submittedAt == null || !bulkState.success) return;
    toast.success(
      `Pathao accepted ${bulkState.orderCount ?? 0} order(s). Processing may take a short time — check the Pathao dashboard if needed.`,
    );
    queueMicrotask(() => setSelected(new Set()));
  }, [bulkState?.submittedAt, bulkState?.success, bulkState?.orderCount]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      {pathaoApiEnabled ? (
        <div className="flex flex-col gap-2 rounded-lg border border-border/80 bg-muted/20 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
          <p className="text-sm text-muted-foreground">
            Select orders below, then create a bulk shipment in Pathao.
          </p>
          <form action={bulkAction} className="flex shrink-0 flex-wrap items-center gap-2">
            <input
              type="hidden"
              name="orderIdsJson"
              value={JSON.stringify([...selected])}
            />
            <Button
              type="submit"
              size="lg"
              variant="secondary"
              disabled={bulkPending || selected.size === 0}
              className="min-h-11 touch-manipulation"
            >
              {bulkPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : null}
              Create bulk orders
              {selected.size > 0 ? ` (${selected.size})` : ""}
            </Button>
          </form>
        </div>
      ) : null}

      <ul className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
        {orders.map((order) => (
          <li key={order._id}>
            <OrderQueueCard
              order={order}
              variant="entry"
              pathaoSelect={
                pathaoApiEnabled
                  ? {
                      enabled: true,
                      selected: selected.has(order._id),
                      onToggle: () => toggle(order._id),
                    }
                  : undefined
              }
            />
          </li>
        ))}
      </ul>
    </>
  );
}
