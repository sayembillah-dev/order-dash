"use client";

import Image from "next/image";
import type { Dispatch, SetStateAction } from "react";
import { useActionState, useEffect, useState } from "react";
import type { createOrder, CreateOrderState } from "@/app/actions/orders";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  clearIntakeDraftStorage,
  emptyIntakeDraft,
  persistIntakeDraft,
  type IntakeDraft,
} from "@/lib/intake-draft";
import { cn } from "@/lib/utils";
import { Loader2, Upload } from "lucide-react";
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

async function uploadToCloudinary(file: File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !preset) {
    throw new Error(
      "Cloudinary is not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.",
    );
  }
  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", preset);
  body.append("folder", "order-dash");

  let res: Response;
  try {
    res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body,
        mode: "cors",
        credentials: "omit",
      },
    );
  } catch (e) {
    if (e instanceof TypeError) {
      throw new Error(
        "Could not reach Cloudinary — check your connection or try another network.",
      );
    }
    throw e;
  }

  if (!res.ok) {
    const text = await res.text();
    let msg = text.slice(0, 220);
    try {
      const json = JSON.parse(text) as { error?: { message?: string } };
      if (json?.error?.message) msg = json.error.message;
    } catch {
      /* not JSON */
    }
    throw new Error(msg || `Upload failed (${res.status})`);
  }

  const data = (await res.json()) as { secure_url?: string };
  if (!data.secure_url) throw new Error("Invalid Cloudinary response");
  return data.secure_url;
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
        if (file.size > 8 * 1024 * 1024) {
          setUploadError("Each image must be 8MB or smaller.");
          continue;
        }
        const url = await uploadToCloudinary(file);
        next.push(url);
      }
      setDraft((d) => ({ ...d, images: next }));
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
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
            onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
          />
        </div>

        <div className="grid gap-2">
          <Label>Photos (optional)</Label>
          <p className="text-xs text-muted-foreground">
            Tap the shaded area — your tap goes straight to the file picker
            (best compatibility on iPhone and Android).
          </p>
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
          </div>
          {uploadError ? (
            <p className="text-sm text-destructive">{uploadError}</p>
          ) : null}
          {draft.images.length > 0 ? (
            <ul className="flex flex-wrap gap-2 pt-1">
              {draft.images.map((url) => (
                <li key={url} className="relative">
                  <Image
                    src={url}
                    alt=""
                    width={64}
                    height={64}
                    unoptimized
                    className="rounded-md border object-cover"
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <Button
          type="submit"
          disabled={pending || uploading}
          className="min-h-11 w-full touch-manipulation text-base"
          size="lg"
        >
          {pending ? "Submitting…" : "Submit order"}
        </Button>
      </form>
    </div>
  );
}
