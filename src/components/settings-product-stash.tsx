"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { convertImageFileToJpeg } from "@/lib/convert-image-to-jpeg";
import { uploadToCloudinary } from "@/lib/cloudinary-upload";
import {
  loadProductStash,
  saveProductStash,
  type ProductStashItem,
} from "@/lib/product-stash";
import { cn } from "@/lib/utils";
import { Loader2, Trash2, Upload } from "lucide-react";

function isLikelyImageFile(file: File): boolean {
  const t = file.type.toLowerCase();
  if (t.startsWith("image/")) return true;
  if (!t || t === "application/octet-stream") {
    return /\.(heic|heif|jpg|jpeg|png|gif|webp|bmp)$/i.test(file.name);
  }
  return false;
}

export function SettingsProductStash() {
  const [items, setItems] = useState<ProductStashItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => setItems(loadProductStash()));
  }, []);

  const persist = useCallback((next: ProductStashItem[]) => {
    setItems(next);
    saveProductStash(next);
  }, []);

  const removeItem = useCallback(
    (id: string) => {
      persist(loadProductStash().filter((i) => i.id !== id));
    },
    [persist],
  );

  async function onFilesSelected(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    setUploading(true);
    try {
      let next = [...loadProductStash()];
      for (const file of Array.from(files)) {
        if (!isLikelyImageFile(file)) {
          setError("Only image files are allowed.");
          continue;
        }
        const jpegFile = await convertImageFileToJpeg(file);
        if (jpegFile.size > 8 * 1024 * 1024) {
          setError("Each photo must be 8MB or smaller after converting to JPEG.");
          continue;
        }
        const url = await uploadToCloudinary(jpegFile, {
          folder: "order-dash/product-stash",
        });
        next = [
          ...next,
          {
            id: crypto.randomUUID(),
            url,
            addedAt: Date.now(),
          },
        ];
      }
      persist(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="rounded-xl border border-border/80 bg-card p-4 shadow-sm sm:p-6">
      <div className="space-y-1">
        <h2 className="text-base font-semibold tracking-tight">
          Common product photos
        </h2>
        <p className="text-sm text-muted-foreground">
          Upload images you reuse often. They appear in Order intake under an
          accordion so you can pick several without uploading each time.
          Stored on this device only.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div
          className={cn(
            "relative inline-flex min-h-11 min-w-[11rem] shrink-0 touch-manipulation items-stretch justify-center",
            uploading && "pointer-events-none cursor-not-allowed opacity-50",
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
            Add photos
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif,image/*"
            multiple
            disabled={uploading}
            className="absolute inset-0 z-10 block min-h-11 w-full cursor-pointer opacity-0"
            style={{ fontSize: "16px" }}
            aria-label="Choose photos for common library"
            onChange={(e) => {
              void onFilesSelected(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {items.length} saved
        </span>
      </div>

      {error ? (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      ) : null}

      {items.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-3">
          {items.map((item) => (
            <li key={item.id} className="relative">
              <div className="relative overflow-hidden rounded-lg border border-border shadow-sm">
                <Image
                  src={item.url}
                  alt=""
                  width={96}
                  height={96}
                  unoptimized
                  className="size-24 object-cover"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -right-2 -top-2 size-8 rounded-full shadow-md"
                aria-label="Remove from library"
                onClick={() => removeItem(item.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          No photos saved yet.
        </p>
      )}
    </section>
  );
}
