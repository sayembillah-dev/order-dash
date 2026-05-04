import type { SerializedOrder } from "@/lib/serialize-order";

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function orderMatchesQuery(order: SerializedOrder, rawQuery: string) {
  const query = rawQuery.trim();
  if (!query) return true;

  const qLower = query.toLowerCase();
  const name = (order.customerName ?? "").toLowerCase();
  if (name.includes(qLower)) return true;

  const qDigits = digitsOnly(query);
  if (!qDigits) return false;

  const phoneDigits = digitsOnly(order.phone ?? "");
  if (!phoneDigits) return false;

  const last4 = phoneDigits.slice(-4);
  if (qDigits.length <= 4) return last4.endsWith(qDigits);

  return phoneDigits.includes(qDigits);
}

