"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import type { SerializedOrder } from "@/lib/serialize-order";
import { Copy } from "lucide-react";
import { toast } from "sonner";

/** One line per field for clipboard paste; collapses internal line breaks. */
function buildPathaoCopyText(order: SerializedOrder): string {
  const single = (s: string) => s.trim().replace(/\s+/g, " ");
  const lines = [
    single(order.customerName),
    single(order.phone),
    single(order.address),
    order.price.toLocaleString(),
  ];
  const note = single(order.orderDetails);
  if (note) lines.push(note);
  return lines.join("\n");
}

async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fallback below */
  }
  return fallbackExecCopy(text);
}

function fallbackExecCopy(text: string): boolean {
  if (typeof document === "undefined") return false;
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  ta.style.top = "0";
  document.body.appendChild(ta);
  ta.select();
  ta.setSelectionRange(0, text.length);
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } finally {
    document.body.removeChild(ta);
  }
  return ok;
}

export function CopyPathaoOrderButton({ order }: { order: SerializedOrder }) {
  const handleCopy = useCallback(async () => {
    const text = buildPathaoCopyText(order);
    const ok = await writeClipboard(text);
    if (ok) {
      toast.success("Copied to clipboard");
    } else {
      toast.error("Could not copy");
    }
  }, [order]);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="min-h-11 shrink-0 touch-manipulation gap-1.5 sm:min-h-9"
      onClick={handleCopy}
      aria-label="Copy order info"
    >
      <Copy className="size-3.5" aria-hidden />
      Copy
    </Button>
  );
}
