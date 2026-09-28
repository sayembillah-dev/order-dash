"use client";

import Image from "next/image";
import { useState } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogClose,
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
          showCloseButton={false}
          className="max-h-[min(97dvh,calc(100dvh-0.5rem))] w-auto max-w-[min(99vw,56rem)] gap-0 overflow-hidden border-0 bg-transparent p-1 shadow-none ring-0 sm:max-h-[min(92dvh,calc(100dvh-2rem))] sm:max-w-[min(96vw,56rem)] sm:p-2"
        >
          <DialogTitle className="sr-only">Order photo</DialogTitle>
          {activeUrl ? (
            <div className="relative flex max-h-[min(95dvh,calc(100dvh-1.5rem))] items-center justify-center rounded-lg bg-background p-1 ring-1 ring-border/60 sm:max-h-[min(88dvh,calc(100dvh-4rem))] sm:p-2">
              <Image
                src={activeUrl}
                alt=""
                width={1600}
                height={1600}
                unoptimized
                className="max-h-[min(93dvh,calc(100dvh-2.5rem))] w-auto max-w-full object-contain sm:max-h-[min(84dvh,calc(100dvh-6rem))]"
              />
              <DialogClose
                render={
                  <button
                    type="button"
                    className="absolute -right-2 -top-2 flex size-9 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-md transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Close photo preview"
                  />
                }
              >
                <X className="size-5" aria-hidden />
              </DialogClose>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
