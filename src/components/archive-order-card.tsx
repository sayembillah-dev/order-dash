"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import {
  deleteOrder,
  reopenBothSteps,
  reopenParcelStep,
  reopenPathaoStep,
  updateArchivedOrder,
  type UpdateArchiveState,
} from "@/app/actions/orders";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { OrderPhotoThumbnails } from "@/components/order-photo-thumbnails";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { FormSubmitToast } from "@/components/form-submit-toast";
import { useLazyMode } from "@/components/lazy-mode-provider";
import { Pencil } from "lucide-react";
import { shouldShowLazyOrderView } from "@/lib/order-view";
import type { SerializedOrder } from "@/lib/serialize-order";
import { toast } from "sonner";

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

function EditOrderForm({
  order,
  onSuccess,
}: {
  order: SerializedOrder;
  onSuccess: () => void;
}) {
  const [state, action, pending] = useActionState(
    updateArchivedOrder,
    {} as UpdateArchiveState
  );

  useEffect(() => {
    if (!state?.success || state.updatedAt == null) return;
    toast.success("Changes saved");
    onSuccess();
  }, [state?.success, state?.updatedAt, onSuccess]);

  return (
    <form
      action={action}
      className="grid gap-4 py-2"
      suppressHydrationWarning
    >
      <input type="hidden" name="orderId" value={order._id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={`name-${order._id}`}>Customer name</Label>
          <Input
            id={`name-${order._id}`}
            name="customerName"
            defaultValue={order.customerName}
            required
            disabled={pending}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`phone-${order._id}`}>Phone</Label>
          <Input
            id={`phone-${order._id}`}
            name="phone"
            defaultValue={order.phone}
            required
            disabled={pending}
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`addr-${order._id}`}>Address</Label>
        <Textarea
          id={`addr-${order._id}`}
          name="address"
          defaultValue={order.address}
          required
          disabled={pending}
          rows={3}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`details-${order._id}`}>
          Order details (optional)
        </Label>
        <Textarea
          id={`details-${order._id}`}
          name="orderDetails"
          defaultValue={order.orderDetails}
          disabled={pending}
          rows={4}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`note-${order._id}`}>Note (optional)</Label>
        <Textarea
          id={`note-${order._id}`}
          name="note"
          defaultValue={order.note}
          disabled={pending}
          rows={3}
        />
      </div>
      <div className="grid max-w-xs gap-2">
        <Label htmlFor={`price-${order._id}`}>Price</Label>
        <Input
          id={`price-${order._id}`}
          name="price"
          type="number"
          min={0}
          step="0.01"
          defaultValue={order.price}
          required
          disabled={pending}
        />
      </div>
      {state?.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      <Button
        type="submit"
        disabled={pending}
        className="min-h-11 w-full touch-manipulation sm:w-auto"
      >
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}

export function ArchiveOrderCard({ order }: { order: SerializedOrder }) {
  const { lazyMode } = useLazyMode();
  const lazyView = shouldShowLazyOrderView(lazyMode, order);
  const [editOpen, setEditOpen] = useState(false);
  const closeEdit = useCallback(() => setEditOpen(false), []);

  const title =
    lazyView && !order.customerName.trim()
      ? order.orderDetails.trim().slice(0, 72) || "Order"
      : order.customerName.trim() || "—";

  return (
    <Card className="flex flex-col">
      <CardHeader className="space-y-2 pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="min-w-0 break-words text-lg leading-snug">
            {title}
          </CardTitle>
          <Badge variant="secondary">{formatWhen(order.createdAt)}</Badge>
        </div>
        {lazyView ? (
          order.phone.trim() ? (
            <p className="text-sm text-muted-foreground">{order.phone}</p>
          ) : null
        ) : (
          <p className="text-sm text-muted-foreground">{order.phone}</p>
        )}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 text-sm">
        {lazyView ? (
          <>
            <div>
              <p className="font-medium text-foreground">Order description</p>
              <p className="whitespace-pre-wrap text-muted-foreground">
                {order.orderDetails.trim() ? order.orderDetails : "—"}
              </p>
            </div>
            <div>
              <p className="font-medium text-foreground">Note</p>
              <p className="whitespace-pre-wrap text-muted-foreground">
                {order.note.trim() ? order.note : "—"}
              </p>
            </div>
            {order.customerName.trim() ? (
              <div>
                <p className="font-medium text-foreground">Name</p>
                <p className="text-muted-foreground">{order.customerName}</p>
              </div>
            ) : null}
            {order.phone.trim() ? (
              <div>
                <p className="font-medium text-foreground">Phone</p>
                <p className="tabular-nums text-muted-foreground">
                  {order.phone}
                </p>
              </div>
            ) : null}
            {order.address.trim() ? (
              <div>
                <p className="font-medium text-foreground">Address</p>
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {order.address}
                </p>
              </div>
            ) : null}
          </>
        ) : (
          <>
            <div>
              <p className="font-medium text-foreground">Address</p>
              <p className="whitespace-pre-wrap text-muted-foreground">
                {order.address}
              </p>
            </div>
            <Separator />
            {order.orderDetails.trim() ? (
              <div>
                <p className="font-medium text-foreground">Order details</p>
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {order.orderDetails}
                </p>
              </div>
            ) : null}
            {order.note.trim() ? (
              <div>
                <p className="font-medium text-foreground">Note</p>
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {order.note}
                </p>
              </div>
            ) : null}
          </>
        )}
        <div>
          <span className="font-medium text-foreground">Price: </span>
          <span>{order.price.toLocaleString()}</span>
        </div>
        {order.images.length > 0 ? (
          <div>
            <p className="mb-2 font-medium text-foreground">Photos</p>
            <OrderPhotoThumbnails
              images={order.images}
              listClassName="flex flex-wrap gap-2"
              thumbnailClassName="h-[72px] w-[72px] rounded-md"
              thumbWidth={72}
              thumbHeight={72}
            />
          </div>
        ) : null}
        <p className="text-xs text-muted-foreground">
          Ready to ship — both Pathao entry and parcel creation are complete.
        </p>
      </CardContent>
      <CardFooter className="mt-auto flex flex-col gap-4 border-t pt-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger
              render={
                <Button
                  variant="secondary"
                  size="sm"
                  className="min-h-11 w-full gap-1 touch-manipulation sm:min-h-9 sm:w-auto"
                  type="button"
                />
              }
            >
              <Pencil className="size-3.5" />
              Edit
            </DialogTrigger>
            <DialogContent className="w-[min(100vw-2rem,32rem)] max-w-[calc(100vw-2rem)] sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Edit order</DialogTitle>
                <DialogDescription>
                  Update details for this archived order.
                </DialogDescription>
              </DialogHeader>
              <EditOrderForm order={order} onSuccess={closeEdit} />
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  variant="destructive"
                  size="sm"
                  type="button"
                  className="min-h-11 w-full touch-manipulation sm:min-h-9 sm:w-auto"
                />
              }
            >
              Delete
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this order?</AlertDialogTitle>
                <AlertDialogDescription>
                  This cannot be undone. The order will be removed from the
                  archive and database.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <form action={deleteOrder} suppressHydrationWarning>
                <FormSubmitToast message="Order deleted" />
                <input type="hidden" name="orderId" value={order._id} />
                <AlertDialogFooter>
                  <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
                  <AlertDialogAction type="submit" variant="destructive">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </form>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Reopen queues (fix mistakes)
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <form
              action={reopenParcelStep}
              className="w-full sm:w-auto"
              suppressHydrationWarning
            >
              <FormSubmitToast message="Parcel queue reopened" />
              <input type="hidden" name="orderId" value={order._id} />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="min-h-11 w-full touch-manipulation sm:min-h-9 sm:w-auto"
              >
                Parcel only
              </Button>
            </form>
            <form
              action={reopenPathaoStep}
              className="w-full sm:w-auto"
              suppressHydrationWarning
            >
              <FormSubmitToast message="Pathao queue reopened" />
              <input type="hidden" name="orderId" value={order._id} />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="min-h-11 w-full touch-manipulation sm:min-h-9 sm:w-auto"
              >
                Pathao only
              </Button>
            </form>
            <form
              action={reopenBothSteps}
              className="w-full sm:w-auto"
              suppressHydrationWarning
            >
              <FormSubmitToast message="Both queues reopened" />
              <input type="hidden" name="orderId" value={order._id} />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="min-h-11 w-full touch-manipulation sm:min-h-9 sm:w-auto"
              >
                Both
              </Button>
            </form>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
