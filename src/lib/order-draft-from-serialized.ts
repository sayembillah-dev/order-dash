import type { SerializedOrder } from "@/lib/serialize-order";
import type { IntakeDraft } from "@/lib/intake-draft";

/** Hydrate intake draft fields from a persisted order (workflow edit). */
export function serializedOrderToIntakeDraft(order: SerializedOrder): IntakeDraft {
  return {
    customerName: order.customerName,
    phone: order.phone,
    address: order.address,
    orderDetails: order.orderDetails,
    note: order.note,
    price: order.price === 0 ? "" : String(order.price),
    images: [...order.images],
  };
}
