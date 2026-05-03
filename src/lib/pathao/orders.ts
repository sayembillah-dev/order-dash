import { getPathaoAccessToken } from "@/lib/pathao/token";
import { getPathaoEnvConfig } from "@/lib/pathao/env";

const ORDERS_PATH = "/aladdin/api/v1/orders";
const BULK_PATH = "/aladdin/api/v1/orders/bulk";

export type PathaoCreateOrderPayload = {
  store_id: number;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  delivery_type: number;
  item_type: number;
  item_quantity: number;
  item_weight: string;
  item_description: string;
  amount_to_collect: number;
};

export type PathaoCreateOrderSuccess = {
  consignment_id?: string;
  merchant_order_id?: string;
  order_status?: string;
  delivery_fee?: number;
};

type PathaoEnvelope<T> = {
  message?: string;
  type?: string;
  code?: number;
  data?: T;
};

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function pathaoCreateOrder(
  payload: PathaoCreateOrderPayload,
): Promise<PathaoCreateOrderSuccess> {
  const cfg = getPathaoEnvConfig();
  const token = await getPathaoAccessToken();

  const res = await fetch(`${cfg.baseUrl}${ORDERS_PATH}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  const parsed = parseJson(text) as PathaoEnvelope<PathaoCreateOrderSuccess> | null;

  if (!res.ok) {
    const msg =
      parsed &&
      typeof parsed === "object" &&
      "message" in parsed &&
      typeof parsed.message === "string"
        ? parsed.message
        : text.trim().slice(0, 300) || `Pathao order error (${res.status})`;
    throw new Error(msg);
  }

  const data = parsed?.data;
  if (!data || typeof data !== "object") {
    throw new Error(
      parsed &&
        typeof parsed === "object" &&
        "message" in parsed &&
        typeof parsed.message === "string"
        ? parsed.message
        : "Unexpected Pathao create order response.",
    );
  }

  return data as PathaoCreateOrderSuccess;
}

export async function pathaoCreateBulkOrders(
  orders: PathaoCreateOrderPayload[],
): Promise<void> {
  const cfg = getPathaoEnvConfig();
  const token = await getPathaoAccessToken();

  const res = await fetch(`${cfg.baseUrl}${BULK_PATH}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ orders }),
  });

  const text = await res.text();
  const parsed = parseJson(text) as PathaoEnvelope<unknown> | null;

  if (res.status !== 202 && !res.ok) {
    const msg =
      parsed &&
      typeof parsed === "object" &&
      "message" in parsed &&
      typeof parsed.message === "string"
        ? parsed.message
        : text.trim().slice(0, 300) || `Pathao bulk order error (${res.status})`;
    throw new Error(msg);
  }

  if (res.status !== 202) {
    throw new Error(
      `Pathao bulk expected 202, got ${res.status}: ${text.trim().slice(0, 200)}`,
    );
  }
}

export function buildPayloadFromOrderFields(input: {
  storeId: number;
  customerName: string;
  phone: string;
  address: string;
  price: number;
}): PathaoCreateOrderPayload {
  return {
    store_id: input.storeId,
    recipient_name: input.customerName.trim(),
    recipient_phone: input.phone.trim(),
    recipient_address: input.address.trim(),
    delivery_type: 48,
    item_type: 2,
    item_quantity: 1,
    item_weight: "0.5",
    item_description: "Saree",
    amount_to_collect: input.price,
  };
}
