import type { SerializedOrder } from "@/lib/serialize-order";

/** Simplified layout/copy when global Lazy mode is on or this order was a lazy submission */
export function shouldShowLazyOrderView(
  lazyModeEnabled: boolean,
  order: SerializedOrder
): boolean {
  return lazyModeEnabled || order.lazySubmission;
}
