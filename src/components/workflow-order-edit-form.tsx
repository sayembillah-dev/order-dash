"use client";

import Image from "next/image";
import {
  deleteOrder,
  updateWorkflowOrder,
  type CreateOrderState,
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
import { FormSubmitToast } from "@/components/form-submit-toast";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IntakeProductStashPicker } from "@/components/intake-product-stash-picker";
import { uploadToCloudinary } from "@/lib/cloudinary-upload";
import { convertImageFileToJpeg } from "@/lib/convert-image-to-jpeg";
import { serializedOrderToIntakeDraft } from "@/lib/order-draft-from-serialized";
import type { IntakeDraft } from "@/lib/intake-draft";
import type { SerializedOrder } from "@/lib/serialize-order";
import { cn } from "@/lib/utils";
import { Loader2, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

function isLikelyImageFile(file: File): boolean {
  const t = file.type.toLowerCase();
  if (t.startsWith("image/")) return true;
  if (!t || t === "application/octet-stream") {
    return /\.(heic|heif|jpg|jpeg|png|gif|webp|bmp)$/i.test(file.name);
  }
  return false;
}

/** Inline edit for orders still in parcel / Pathao queues (entry cards). */
export function WorkflowOrderEditForm({
  order,
  showDelete = false,
}: {
  order: SerializedOrder;
  showDelete?: boolean;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<IntakeDraft>(() =>
    serializedOrderToIntakeDraft(order),
  );
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(false);

  const effectiveLazy = order.lazySubmission;

  useEffect(() => {
    queueMicrotask(() => {
      setDraft(serializedOrderToIntakeDraft(order));
    });
  }, [order]);

  const [state, formAction, pending] = useActionState(
    updateWorkflowOrder,
    {} as CreateOrderState,
  );

  useEffect(() => {
    if (state?.submittedAt == null) return;
    toast.success("Order updated");
    queueMicrotask(() => {
      setOpen(false);
      router.refresh();
    });
  }, [state?.submittedAt, router]);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state?.error]);

  async function onFilesSelected(files: FileList | null) {
    if (!files?.length) return;
    setUploadError(null);
    setUploading(true);
    try {
      const next: string[] = [...draft.images];
      for (const file of Array.from(files)) {
        if (!isLikelyImageFile(file)) {
          setUploadError(
            "Only image files are allowed (photos from library or camera).",
          );
          continue;
        }
        const jpegFile = await convertImageFileToJpeg(file);
        if (jpegFile.size > 8 * 1024 * 1024) {
          setUploadError(
            "Each photo must be 8MB or smaller after converting to JPEG.",
          );
          continue;
        }
        const url = await uploadToCloudinary(jpegFile);
        next.push(url);
      }
      setDraft((d) => ({ ...d, images: next }));
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function removeImageAt(index: number) {
    setUploadError(null);
    setDraft((d) => ({
      ...d,
      images: d.images.filter((_, i) => i !== index),
    }));
  }

  function toggleStashUrl(url: string) {
    setUploadError(null);
    setDraft((d) => {
      const has = d.images.includes(url);
      if (has) {
        return { ...d, images: d.images.filter((u) => u !== url) };
      }
      return { ...d, images: [...d.images, url] };
    });
  }

  return (
    <div className="border-t border-border/80 bg-muted/10">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted/30"
      >
        <span>Edit order details</span>
        <span className="text-muted-foreground">{open ? "−" : "+"}</span>
      </button>
      {open ? (
        <form
          action={formAction}
          className="space-y-4 border-t border-border/80 px-4 pb-4 pt-3"
          suppressHydrationWarning
        >
          <input type="hidden" name="orderId" value={order._id} />
          <input
            type="hidden"
            name="imagesJson"
            value={JSON.stringify(draft.images)}
          />
          <input
            type="hidden"
            name="lazyMode"
            value={effectiveLazy ? "1" : "0"}
          />

          {effectiveLazy ? (
            <>
              <input type="hidden" name="customerName" value="" />
              <input type="hidden" name="phone" value="" />
              <input type="hidden" name="address" value="" />
              <input type="hidden" name="price" value="0" />

              <div className="grid gap-2">
                <Label htmlFor={`edit-${order._id}-desc`}>Order description</Label>
                <Textarea
                  id={`edit-${order._id}-desc`}
                  name="orderDetails"
                  required
                  disabled={pending}
                  rows={4}
                  value={draft.orderDetails}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, orderDetails: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`edit-${order._id}-note`}>Note</Label>
                <Textarea
                  id={`edit-${order._id}-note`}
                  name="note"
                  required
                  disabled={pending}
                  rows={3}
                  value={draft.note}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, note: e.target.value }))
                  }
                />
              </div>
            </>
          ) : (
            <>
              <input type="hidden" name="note" value="" />

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor={`edit-${order._id}-name`}>Customer name</Label>
                  <Input
                    id={`edit-${order._id}-name`}
                    name="customerName"
                    required
                    disabled={pending}
                    value={draft.customerName}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, customerName: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`edit-${order._id}-phone`}>Phone</Label>
                  <Input
                    id={`edit-${order._id}-phone`}
                    name="phone"
                    type="tel"
                    required
                    disabled={pending}
                    value={draft.phone}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, phone: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`edit-${order._id}-addr`}>Address</Label>
                <Textarea
                  id={`edit-${order._id}-addr`}
                  name="address"
                  required
                  disabled={pending}
                  rows={3}
                  value={draft.address}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, address: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`edit-${order._id}-details`}>
                  Order details (optional)
                </Label>
                <Textarea
                  id={`edit-${order._id}-details`}
                  name="orderDetails"
                  disabled={pending}
                  rows={3}
                  value={draft.orderDetails}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, orderDetails: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2 sm:max-w-xs">
                <Label htmlFor={`edit-${order._id}-price`}>Price</Label>
                <Input
                  id={`edit-${order._id}-price`}
                  name="price"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  required
                  disabled={pending}
                  value={draft.price}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, price: e.target.value }))
                  }
                />
              </div>
            </>
          )}

          <div className="grid gap-2">
            <Label>
              Photos {effectiveLazy ? "(required)" : "(optional)"}
            </Label>
            <IntakeProductStashPicker
              selectedUrls={draft.images}
              onToggleUrl={toggleStashUrl}
              disabled={pending || uploading}
            />
            <div className="flex flex-wrap items-center gap-3">
              <div
                className={cn(
                  "relative inline-flex min-h-11 min-w-[11rem] shrink-0 touch-manipulation items-stretch justify-center",
                  (pending || uploading) &&
                    "pointer-events-none cursor-not-allowed opacity-50",
                )}
              >
                <span
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "pointer-events-none gap-2",
                  )}
                  aria-hidden
                >
                  {uploading ? (
                    <Loader2 className="size-4 shrink-0 animate-spin" />
                  ) : (
                    <Upload className="size-4 shrink-0" />
                  )}
                  Upload images
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif,image/*"
                  multiple
                  disabled={pending || uploading}
                  className="absolute inset-0 z-10 block min-h-11 w-full cursor-pointer opacity-0"
                  style={{ fontSize: "16px" }}
                  aria-label="Choose photos to upload"
                  onChange={(e) => {
                    void onFilesSelected(e.target.files);
                    e.target.value = "";
                  }}
                />
              </div>
              <span className="text-sm text-muted-foreground">
                {draft.images.length} image(s)
              </span>
            </div>
            {uploadError ? (
              <p className="text-sm text-destructive">{uploadError}</p>
            ) : null}
            {draft.images.length > 0 ? (
              <ul className="flex flex-wrap gap-3 pt-1">
                {draft.images.map((url, index) => (
                  <li
                    key={`${index}-${url}`}
                    className="relative inline-block touch-manipulation"
                  >
                    <Image
                      src={url}
                      alt=""
                      width={56}
                      height={56}
                      unoptimized
                      className="size-14 rounded-md border object-cover"
                    />
                    <button
                      type="button"
                      disabled={pending || uploading}
                      onClick={() => removeImageAt(index)}
                      className="absolute -right-1.5 -top-1.5 flex size-7 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Remove photo ${index + 1}`}
                    >
                      <X className="size-3.5" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <Button
            type="submit"
            disabled={
              pending ||
              uploading ||
              (effectiveLazy && draft.images.length === 0)
            }
            className="min-h-11 w-full touch-manipulation"
          >
            {pending ? "Saving…" : "Save changes"}
          </Button>

          {showDelete ? (
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button
                    type="button"
                    variant="destructive"
                    className="min-h-11 w-full touch-manipulation"
                    disabled={pending || uploading}
                  />
                }
              >
                Delete order
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this order?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This cannot be undone. The order will be permanently removed
                    from all queues and history.
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
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
