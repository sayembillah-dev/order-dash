"use client";

import Image from "next/image";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Props = {
  images: string[];
  /** Classes on the wrapping `<ul>` */
  listClassName?: string;
  /** Classes on each thumbnail `<button>` (layout/size) */
  thumbnailClassName?: string;
  /** Classes on each `<li>` */
  itemClassName?: string;
  thumbWidth?: number;
  thumbHeight?: number;
};

export function OrderPhotoThumbnails({
  images,
  listClassName,
  thumbnailClassName,
  itemClassName,
  thumbWidth = 88,
  thumbHeight = 88,
}: Props) {
  const [open, setOpen] = useState(false);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);

  if (images.length === 0) return null;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setActiveUrl(null);
  }

  return (
    <>
      <ul
        className={listClassName}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {images.map((url) => (
          <li key={url} className={itemClassName}>
            <button
              type="button"
              onClick={() => {
                setActiveUrl(url);
                setOpen(true);
              }}
              className={cn(
                "block touch-manipulation overflow-hidden border border-border shadow-sm transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                thumbnailClassName
              )}
              aria-label="View photo"
            >
              <Image
                src={url}
                alt=""
                width={thumbWidth}
                height={thumbHeight}
                unoptimized
                className="h-full w-full object-cover"
              />
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          showCloseButton
          className="max-h-[min(92dvh,calc(100dvh-2rem))] w-auto max-w-[min(96vw,56rem)] gap-0 overflow-hidden border-0 bg-transparent p-2 shadow-none ring-0 sm:max-w-[min(96vw,56rem)]"
        >
          <DialogTitle className="sr-only">Order photo</DialogTitle>
          {activeUrl ? (
            <div className="flex max-h-[min(88dvh,calc(100dvh-4rem))] items-center justify-center rounded-lg bg-background p-2 ring-1 ring-border/60">
              <Image
                src={activeUrl}
                alt=""
                width={1600}
                height={1600}
                unoptimized
                className="max-h-[min(84dvh,calc(100dvh-6rem))] w-auto max-w-full object-contain"
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
