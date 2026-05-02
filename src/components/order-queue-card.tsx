import { CopyPathaoOrderButton } from "@/components/copy-pathao-order-button";
import { ParcelQueueAccordion } from "@/components/parcel-queue-accordion";
import { QueueMarkDoneForm } from "@/components/queue-mark-done-form";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

export function OrderQueueCard({
  order,
  variant,
}: {
  order: SerializedOrder;
  variant: "parcel" | "entry";
}) {
  const label =
    variant === "parcel" ? "Order created" : "Confirmed Pathao entry";

  return (
    <Card className="flex flex-col overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md">
      {variant === "entry" ? (
        <>
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm text-muted-foreground">Name</p>
              <CardTitle className="min-w-0 break-words text-xl font-semibold leading-snug tracking-tight">
                {order.customerName}
              </CardTitle>
            </div>
            <CopyPathaoOrderButton order={order} />
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
          <CardHeader className="flex flex-row items-center justify-end space-y-0 pb-2">
            <Badge
              variant="secondary"
              className="max-w-[min(100%,11rem)] shrink-0 truncate text-xs font-normal tabular-nums"
              title={formatWhen(order.createdAt)}
            >
              {formatWhen(order.createdAt)}
            </Badge>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col px-2 pb-2 pt-0 sm:px-3">
            <ParcelQueueAccordion order={order} />
          </CardContent>
        </>
      )}

      <CardFooter className="mt-auto border-t border-border/80 bg-muted/20 pt-4">
        <QueueMarkDoneForm
          variant={variant}
          orderId={order._id}
          label={label}
        />
      </CardFooter>
    </Card>
  );
}
