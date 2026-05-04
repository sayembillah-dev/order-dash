"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { OrderPhotoThumbnails } from "@/components/order-photo-thumbnails";
import { useLazyMode } from "@/components/lazy-mode-provider";
import { cn } from "@/lib/utils";
import { shouldShowLazyOrderView } from "@/lib/order-view";
import type { SerializedOrder } from "@/lib/serialize-order";

const PANEL_ID = "parcel-more";

/** Last 4 digits for compact parcel view */
function phoneLastFour(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 4) return digits.slice(-4);
  if (digits.length > 0) return digits;
  return "—";
}

export function ParcelQueueAccordion({ order }: { order: SerializedOrder }) {
  const { lazyMode } = useLazyMode();
  const lazyView = shouldShowLazyOrderView(lazyMode, order);

  return (
    <div className="flex w-full flex-col gap-4">
      {lazyView ? (
        <>
          {order.orderDetails.trim() ? (
            <div className="space-y-2">
              <p className="text-[0.65rem] font-bold uppercase tracking-wider text-emerald-800/90 dark:text-emerald-400/90">
                Order description
              </p>
              <div
                className={cn(
                  "order-detail-spotlight relative rounded-xl border-2 border-emerald-200/90 bg-gradient-to-b from-green-50 via-green-50 to-emerald-50/90 p-4",
                  "ring-1 ring-emerald-300/35 dark:border-emerald-700/45 dark:from-emerald-950/45 dark:via-emerald-950/35 dark:to-green-950/30 dark:ring-emerald-600/20"
                )}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(ellipse_at_top,rgb(220_252_231/0.85),transparent_58%)] dark:bg-[radial-gradient(ellipse_at_top,rgb(6_78_59/0.35),transparent_55%)]"
                />
                <p className="relative whitespace-pre-wrap text-sm font-bold leading-relaxed text-foreground">
                  {order.orderDetails}
                </p>
              </div>
            </div>
          ) : null}
          {order.note.trim() ? (
            <div className="space-y-2">
              <p className="text-[0.65rem] font-bold uppercase tracking-wider text-amber-900/90 dark:text-amber-400/90">
                Note
              </p>
              <div
                className={cn(
                  "relative rounded-xl border-2 border-amber-200/90 bg-gradient-to-b from-amber-50 via-amber-50/90 to-orange-50/80 p-4",
                  "ring-1 ring-amber-300/35 dark:border-amber-800/50 dark:from-amber-950/40 dark:via-amber-950/30 dark:to-orange-950/25 dark:ring-amber-700/25"
                )}
              >
                <p className="relative whitespace-pre-wrap text-sm font-bold leading-relaxed text-foreground">
                  {order.note}
                </p>
              </div>
            </div>
          ) : null}
        </>
      ) : order.orderDetails.trim() ? (
        <div className="space-y-2">
          <p className="text-[0.65rem] font-bold uppercase tracking-wider text-emerald-800/90 dark:text-emerald-400/90">
            Order details
          </p>
          <div
            className={cn(
              "order-detail-spotlight relative rounded-xl border-2 border-emerald-200/90 bg-gradient-to-b from-green-50 via-green-50 to-emerald-50/90 p-4",
              "ring-1 ring-emerald-300/35 dark:border-emerald-700/45 dark:from-emerald-950/45 dark:via-emerald-950/35 dark:to-green-950/30 dark:ring-emerald-600/20"
            )}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(ellipse_at_top,rgb(220_252_231/0.85),transparent_58%)] dark:bg-[radial-gradient(ellipse_at_top,rgb(6_78_59/0.35),transparent_55%)]"
            />
            <p className="relative whitespace-pre-wrap text-sm font-bold leading-relaxed text-foreground">
              {order.orderDetails}
            </p>
          </div>
        </div>
      ) : null}

      <Accordion defaultValue={[]} className="w-full">
        <AccordionItem value={PANEL_ID} className="border-0">
          <AccordionTrigger className="gap-3 rounded-lg py-3 hover:no-underline [&_[data-slot=accordion-trigger-icon]]:mt-1 [&_[data-slot=accordion-trigger-icon]]:shrink-0">
            {lazyView ? (
              <div className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left">
                <p className="text-sm font-bold text-foreground">Photos</p>
                <span className="text-xs font-bold tabular-nums text-muted-foreground">
                  {order.images.length} file
                  {order.images.length !== 1 ? "s" : ""}
                </span>
              </div>
            ) : (
              <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 text-left sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="text-xl font-semibold leading-snug tracking-tight">
                    {order.customerName.trim() ? order.customerName : "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="text-xl font-medium tabular-nums tracking-wide">
                    {phoneLastFour(order.phone)}
                  </p>
                </div>
              </div>
            )}
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-5 pb-2">
            {order.images.length > 0 ? (
              <div className="rounded-xl border border-border/80 bg-muted/30 p-3 sm:p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">
                    Photos
                  </p>
                  <span className="text-xs font-bold tabular-nums text-muted-foreground">
                    {order.images.length} file
                    {order.images.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <OrderPhotoThumbnails
                  images={order.images}
                  listClassName="-mx-0.5 flex gap-3 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:thin] sm:flex-wrap sm:overflow-visible"
                  itemClassName="shrink-0 snap-start"
                  thumbnailClassName="h-28 w-28 rounded-lg sm:h-32 sm:w-32"
                  thumbWidth={128}
                  thumbHeight={128}
                />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center text-sm font-bold text-muted-foreground">
                No photos
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
