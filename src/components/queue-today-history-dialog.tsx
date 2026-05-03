"use client";

import {
  getTodayParcelStepsCompleted,
  getTodayPathaoEntriesCompleted,
} from "@/app/actions/orders";
import { OrderQueueCard } from "@/components/order-queue-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SerializedOrder } from "@/lib/serialize-order";
import { History, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export function QueueTodayHistoryDialog({
  variant,
}: {
  variant: "parcel" | "entry";
}) {
  const [open, setOpen] = useState(false);
  const [orders, setOrders] = useState<SerializedOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data =
        variant === "parcel"
          ? await getTodayParcelStepsCompleted()
          : await getTodayPathaoEntriesCompleted();
      setOrders(data);
    } catch {
      setError("Could not load history.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [variant]);

  useEffect(() => {
    if (!open) return;
    void load();
  }, [open, load]);

  const title =
    variant === "parcel"
      ? "Today — parcel marked complete"
      : "Today — Pathao marked complete";

  const description =
    variant === "parcel"
      ? "Orders you tapped “Order created” today (UTC). Same card layout as Parcel creation; these already left your queue. Rows finished before parcel completion timestamps were saved won’t appear."
      : "Orders you tapped Pathao complete today (UTC). Same card layout as Pathao entry; these already left your queue. Rows finished before Pathao completion timestamps were saved won’t appear.";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9 shrink-0 touch-manipulation"
            aria-label={
              variant === "parcel"
                ? "Today’s parcel completions"
                : "Today’s Pathao completions"
            }
          />
        }
      >
        <History className="size-4" aria-hidden />
      </DialogTrigger>

      <DialogContent
        showCloseButton
        className={cn(
          "fixed inset-0 left-0 top-0 z-50 flex h-[100dvh] max-h-none w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none p-0 sm:inset-4 sm:h-auto sm:max-h-[min(92dvh,calc(100dvh-2rem))] sm:rounded-xl",
        )}
      >
        <DialogHeader className="shrink-0 border-b bg-background px-4 py-4 text-left sm:px-6">
          <DialogTitle className="text-lg">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" aria-hidden />
              <span>Loading…</span>
            </div>
          ) : error ? (
            <p className="py-8 text-center text-sm text-destructive">{error}</p>
          ) : orders.length === 0 ? (
            <p className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
              {variant === "parcel"
                ? "No parcel jobs were marked complete today (UTC) yet."
                : "No Pathao entries were marked complete today (UTC) yet."}
            </p>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
              {orders.map((order) => (
                <li key={order._id}>
                  <OrderQueueCard
                    order={order}
                    variant={variant}
                    showQueueActions={false}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
