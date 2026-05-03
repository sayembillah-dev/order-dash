"use client";

import Image from "next/image";
import type { Dispatch, SetStateAction } from "react";
import { useActionState, useEffect, useState } from "react";
import type { createOrder, CreateOrderState } from "@/app/actions/orders";
import { useLazyMode } from "@/components/lazy-mode-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IntakeProductStashPicker } from "@/components/intake-product-stash-picker";
import { uploadToCloudinary } from "@/lib/cloudinary-upload";
import { convertImageFileToJpeg } from "@/lib/convert-image-to-jpeg";
import {
  clearIntakeDraftStorage,
  emptyIntakeDraft,
  persistIntakeDraft,
  type IntakeDraft,
} from "@/lib/intake-draft";
import { cn } from "@/lib/utils";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

/** iOS/Android often leave MIME empty or use octet-stream for camera/library picks */
function isLikelyImageFile(file: File): boolean {
  const t = file.type.toLowerCase();
  if (t.startsWith("image/")) return true;
  if (!t || t === "application/octet-stream") {
    return /\.(heic|heif|jpg|jpeg|png|gif|webp|bmp)$/i.test(file.name);
  }
  return false;
}

export function IntakeForm({
  action,
  draft,
  setDraft,
}: {
  action: typeof createOrder;
  draft: IntakeDraft;
  setDraft: Dispatch<SetStateAction<IntakeDraft>>;
}) {
  const { lazyMode } = useLazyMode();
  const [state, formAction, pending] = useActionState(
    action,
    {} as CreateOrderState,
  );
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (state?.submittedAt == null) return;
    toast.success("Order submitted");
    clearIntakeDraftStorage();
    setDraft(emptyIntakeDraft());
  }, [state?.submittedAt, setDraft]);

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
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

  function clearAllImages() {
    setUploadError(null);
    setDraft((d) => ({ ...d, images: [] }));
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
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold tracking-tight">New order</h2>
        <p className="text-sm text-muted-foreground">
          Creates a pending order for parcel creation and Pathao entry queues.
          Your progress is saved on this device while you type.
        </p>
      </div>
      <form
        action={formAction}
        className="grid gap-6"
        suppressHydrationWarning
        onSubmit={() => {
          persistIntakeDraft(draft);
        }}
      >
        <input
          type="hidden"
          name="imagesJson"
          value={JSON.stringify(draft.images)}
        />
        <input type="hidden" name="lazyMode" value={lazyMode ? "1" : "0"} />

        {lazyMode ? (
          <>
            <input type="hidden" name="customerName" value="" />
            <input type="hidden" name="phone" value="" />
            <input type="hidden" name="address" value="" />
            <input type="hidden" name="price" value="0" />

            <div className="grid gap-2">
              <Label htmlFor="orderDetails">Order description</Label>
              <Textarea
                id="orderDetails"
                name="orderDetails"
                required
                disabled={pending}
                rows={5}
                value={draft.orderDetails}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, orderDetails: e.target.value }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                name="note"
                required
                disabled={pending}
                rows={4}
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="customerName">Customer name</Label>
                <Input
                  id="customerName"
                  name="customerName"
                  required
                  disabled={pending}
                  autoComplete="name"
                  value={draft.customerName}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, customerName: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
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
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
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
              <Label htmlFor="orderDetails">Order details (optional)</Label>
              <Textarea
                id="orderDetails"
                name="orderDetails"
                disabled={pending}
                rows={4}
                value={draft.orderDetails}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, orderDetails: e.target.value }))
                }
              />
            </div>

            <div className="grid gap-2 sm:max-w-xs">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
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
            Photos {lazyMode ? "(required)" : "(optional)"}
          </Label>
          <p className="text-xs text-muted-foreground">
            Tap the shaded area — your tap goes straight to the file picker
            (best compatibility on iPhone and Android). Photos are converted to
            JPEG (including HEIC from iPhone) before upload; max 8MB per photo
            after conversion.
          </p>

          <IntakeProductStashPicker
            selectedUrls={draft.images}
            onToggleUrl={toggleStashUrl}
            disabled={pending || uploading}
          />

          <div className="flex flex-wrap items-center gap-3">
            {/* Invisible file input on top so taps hit the native input (fixes many mobile WebKit bugs). */}
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
              {draft.images.length} image(s) attached
            </span>
            {draft.images.length > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto min-h-9 px-2 text-muted-foreground"
                disabled={pending || uploading}
                onClick={clearAllImages}
              >
                Remove all photos
              </Button>
            ) : null}
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
                    width={64}
                    height={64}
                    unoptimized
                    className="size-16 rounded-md border object-cover sm:size-20"
                  />
                  <button
                    type="button"
                    disabled={pending || uploading}
                    onClick={() => removeImageAt(index)}
                    className={cn(
                      "absolute -right-1.5 -top-1.5 flex size-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm",
                      "transition-colors hover:bg-destructive/10 hover:text-destructive",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      (pending || uploading) && "pointer-events-none opacity-50",
                    )}
                    aria-label={`Remove photo ${index + 1}`}
                  >
                    <X className="size-4" aria-hidden />
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
            (lazyMode && draft.images.length === 0)
          }
          className="min-h-11 w-full touch-manipulation text-base"
          size="lg"
        >
          {pending ? "Submitting…" : "Submit order"}
        </Button>
      </form>
    </div>
  );
}
