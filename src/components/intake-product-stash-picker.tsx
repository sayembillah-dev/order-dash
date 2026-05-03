"use client";

import Image from "next/image";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  PRODUCT_STASH_STORAGE_KEY,
  loadProductStash,
  type ProductStashItem,
} from "@/lib/product-stash";
import { cn } from "@/lib/utils";
import { Check, Images } from "lucide-react";
import { useEffect, useState } from "react";

const PANEL_ID = "common-product-photos";

export function IntakeProductStashPicker({
  selectedUrls,
  onToggleUrl,
  disabled,
}: {
  selectedUrls: string[];
  onToggleUrl: (url: string) => void;
  disabled: boolean;
}) {
  const [stash, setStash] = useState<ProductStashItem[]>([]);

  useEffect(() => {
    function refresh() {
      setStash(loadProductStash());
    }
    refresh();
    function onStorage(e: StorageEvent) {
      if (e.key === PRODUCT_STASH_STORAGE_KEY || e.key === null) refresh();
    }
    window.addEventListener("storage", onStorage);
    window.addEventListener("order-dash-product-stash-change", refresh);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("order-dash-product-stash-change", refresh);
    };
  }, []);

  if (stash.length === 0) return null;

  return (
    <Accordion defaultValue={[]} className="w-full rounded-xl border border-border/70 bg-muted/25">
      <AccordionItem value={PANEL_ID} className="border-0">
        <AccordionTrigger className="gap-2 rounded-lg px-3 py-3 hover:no-underline [&_[data-slot=accordion-trigger-icon]]:shrink-0">
          <div className="flex min-w-0 flex-1 items-center gap-2 text-left">
            <Images className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="font-medium">Common product photos</span>
            <span className="text-xs tabular-nums text-muted-foreground">
              ({stash.length} in library)
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-3 pb-3">
          <p className="mb-3 text-xs text-muted-foreground">
            Tap photos to add or remove from this order. Multiple selection is
            allowed.
          </p>
          <ul className="flex flex-wrap gap-3">
            {stash.map((item) => {
              const selected = selectedUrls.includes(item.url);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    disabled={disabled}
                    aria-pressed={selected}
                    onClick={() => onToggleUrl(item.url)}
                    className={cn(
                      "relative touch-manipulation rounded-lg border-2 bg-background p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      selected
                        ? "border-primary shadow-sm ring-2 ring-primary/25"
                        : "border-transparent hover:border-border",
                      disabled && "pointer-events-none opacity-50",
                    )}
                  >
                    <Image
                      src={item.url}
                      alt=""
                      width={72}
                      height={72}
                      unoptimized
                      className="size-[72px] rounded-md object-cover sm:size-20"
                    />
                    {selected ? (
                      <span className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                        <Check className="size-3.5" strokeWidth={3} aria-hidden />
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
