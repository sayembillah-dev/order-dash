import {
  completeParcelCreation,
  completePathaoEntry,
} from "@/app/actions/orders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OrderPhotoThumbnails } from "@/components/order-photo-thumbnails";
import { cn } from "@/lib/utils";
import type { SerializedOrder } from "@/lib/serialize-order";

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Last 4 digits for compact parcel view; masks when fewer digits exist */
function phoneLastFour(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 4) return digits.slice(-4);
  if (digits.length > 0) return digits;
  return "—";
}

export function OrderQueueCard({
  order,
  variant,
}: {
  order: SerializedOrder;
  variant: "parcel" | "entry";
}) {
  const action =
    variant === "parcel" ? completeParcelCreation : completePathaoEntry;
  const label =
    variant === "parcel" ? "Order created" : "Confirmed Pathao entry";

  return (
    <Card className="flex flex-col overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md">
      {variant === "entry" ? (
        <>
          <CardHeader className="space-y-1 pb-3">
            <p className="text-sm text-muted-foreground">Name</p>
            <CardTitle className="min-w-0 break-words text-xl font-semibold leading-snug tracking-tight">
              {order.customerName}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4 pb-2 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Phone</p>
              <p className="font-medium tabular-nums">{order.phone}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Address</p>
              <p className="whitespace-pre-wrap leading-snug">{order.address}</p>
            </div>
            <div className="flex items-baseline justify-between gap-2 border-t border-border/80 pt-4">
              <span className="text-muted-foreground">Total</span>
              <span className="text-lg font-semibold tabular-nums">
                {order.price.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </>
      ) : (
        <>
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
            <CardTitle className="min-w-0 flex-1 break-words text-xl font-semibold leading-snug tracking-tight">
              {order.customerName}
            </CardTitle>
            <Badge
              variant="secondary"
              className="max-w-[min(100%,11rem)] shrink-0 truncate text-xs font-normal tabular-nums"
              title={formatWhen(order.createdAt)}
            >
              {formatWhen(order.createdAt)}
            </Badge>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col gap-4 pb-2">
            {/* Phone: last 4 only — parcel queue */}
            <div className="flex items-baseline gap-2 text-sm">
              <span className="text-muted-foreground">Phone</span>
              <span className="font-medium tabular-nums tracking-wide">
                ••••{phoneLastFour(order.phone)}
              </span>
            </div>

            {/* Order details — spotlight + pulse */}
            <div className="space-y-2">
              <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-emerald-800/90 dark:text-emerald-400/90">
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
                <p className="relative whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {order.orderDetails}
                </p>
              </div>
            </div>

            {/* Photos */}
            {order.images.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                    Photos
                  </p>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {order.images.length} file
                    {order.images.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <OrderPhotoThumbnails
                  images={order.images}
                  listClassName="-mx-1 flex gap-2 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:thin] sm:flex-wrap sm:overflow-visible"
                  itemClassName="shrink-0 snap-start"
                  thumbnailClassName="h-[5.5rem] w-[5.5rem] rounded-lg sm:h-24 sm:w-24"
                />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No photos</p>
            )}
          </CardContent>
        </>
      )}

      <CardFooter className="mt-auto border-t border-border/80 bg-muted/20 pt-4">
        <form
          action={action}
          className="w-full"
          suppressHydrationWarning
        >
          <input type="hidden" name="orderId" value={order._id} />
          <Button
            type="submit"
            className="min-h-11 w-full touch-manipulation sm:w-auto"
            size="lg"
          >
            {label}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
