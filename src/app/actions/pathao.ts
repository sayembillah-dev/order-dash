"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { completePathaoEntry } from "@/app/actions/orders";
import { requireAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/lib/models/Order";
import { getPathaoEnvConfig } from "@/lib/pathao/env";
import {
  buildPayloadFromOrderFields,
  pathaoCreateBulkOrders,
  pathaoCreateOrder,
} from "@/lib/pathao/orders";

const orderIdSchema = z.string().refine(
  (id) => /^[a-f\d]{24}$/i.test(id),
  "Invalid order id",
);

export type PathaoQueueState = {
  error?: string;
  success?: boolean;
  /** New on each successful submit for client effects */
  submittedAt?: number;
  mode?: "manual" | "api";
  consignmentId?: string;
  deliveryFee?: number;
};

export type PathaoBulkState = {
  error?: string;
  success?: boolean;
  submittedAt?: number;
  orderCount?: number;
};

function shippingValidationError(order: {
  customerName?: string;
  phone?: string;
  address?: string;
}): string | null {
  const name = (order.customerName ?? "").trim();
  const phone = (order.phone ?? "").trim();
  const addr = (order.address ?? "").trim();
  if (!name || !phone || !addr) {
    return "Add customer name, phone, and address before sending to Pathao.";
  }
  return null;
}

async function completePathaoEntryWithApiInner(
  formData: FormData,
): Promise<PathaoQueueState> {
  await requireAuth();
  const id = orderIdSchema.parse(String(formData.get("orderId") ?? ""));

  await connectDB();
  const order = await Order.findById(id).exec();
  if (!order) {
    return { error: "Order not found" };
  }
  if (order.pathaoEntryDone) {
    return { error: "This order is no longer pending Pathao entry." };
  }

  const shipErr = shippingValidationError(order);
  if (shipErr) {
    return { error: shipErr };
  }

  let cfg;
  try {
    cfg = getPathaoEnvConfig();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Pathao configuration error.";
    return { error: msg };
  }

  try {
    const payload = buildPayloadFromOrderFields({
      storeId: cfg.storeId,
      customerName: order.customerName ?? "",
      phone: order.phone ?? "",
      address: order.address ?? "",
      price: order.price,
    });

    const data = await pathaoCreateOrder(payload);
    const consignmentId =
      data.consignment_id != null ? String(data.consignment_id) : undefined;
    const deliveryFee =
      typeof data.delivery_fee === "number" ? data.delivery_fee : undefined;

    await Order.findByIdAndUpdate(id, {
      pathaoEntryDone: true,
      pathaoEntryCompletedAt: new Date(),
      pathaoConsignmentId: consignmentId,
      pathaoDeliveryFee: deliveryFee,
      $unset: { pathaoBulkAcceptedAt: "" },
    });

    revalidatePath("/intake");
    revalidatePath("/entry");
    revalidatePath("/archive");

    return {
      success: true,
      submittedAt: Date.now(),
      mode: "api",
      consignmentId,
      deliveryFee,
    };
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "Pathao request failed. Try again.";
    return { error: msg };
  }
}

/**
 * Pathao entry queue: manual mark-done or API create order, selected via hidden `usePathaoApi`.
 */
export async function submitPathaoQueueCompletion(
  _prev: PathaoQueueState | undefined,
  formData: FormData,
): Promise<PathaoQueueState> {
  const useApi = String(formData.get("usePathaoApi") ?? "") === "1";
  if (!useApi) {
    try {
      await completePathaoEntry(formData);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not update order.";
      return { error: msg };
    }
    return { success: true, submittedAt: Date.now(), mode: "manual" };
  }
  return completePathaoEntryWithApiInner(formData);
}

export async function createPathaoBulkOrders(
  _prev: PathaoBulkState | undefined,
  formData: FormData,
): Promise<PathaoBulkState> {
  await requireAuth();

  const raw = String(formData.get("orderIdsJson") ?? "").trim();
  let ids: unknown;
  try {
    ids = JSON.parse(raw);
  } catch {
    return { error: "Invalid order list." };
  }

  const listParsed = z.array(orderIdSchema).min(1).safeParse(ids);
  if (!listParsed.success) {
    const first = Object.values(listParsed.error.flatten().fieldErrors)[0]?.[0];
    return { error: first ?? "Select at least one order." };
  }

  const uniqueIds = [...new Set(listParsed.data)];

  let cfg;
  try {
    cfg = getPathaoEnvConfig();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Pathao configuration error.";
    return { error: msg };
  }

  await connectDB();
  const orders = await Order.find({
    _id: { $in: uniqueIds },
    pathaoEntryDone: false,
  }).exec();

  if (orders.length !== uniqueIds.length) {
    return {
      error:
        "Some orders were not found or already completed. Refresh and try again.",
    };
  }

  const payloads = [];
  for (const order of orders) {
    const shipErr = shippingValidationError(order);
    if (shipErr) {
      return { error: shipErr };
    }
    payloads.push(
      buildPayloadFromOrderFields({
        storeId: cfg.storeId,
        customerName: order.customerName ?? "",
        phone: order.phone ?? "",
        address: order.address ?? "",
        price: order.price,
      }),
    );
  }

  try {
    await pathaoCreateBulkOrders(payloads);
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "Pathao bulk request failed. Try again.";
    return { error: msg };
  }

  const now = new Date();
  await Order.updateMany(
    { _id: { $in: uniqueIds } },
    {
      $set: {
        pathaoEntryDone: true,
        pathaoEntryCompletedAt: now,
        pathaoBulkAcceptedAt: now,
      },
      $unset: {
        pathaoConsignmentId: "",
        pathaoDeliveryFee: "",
      },
    },
  );

  revalidatePath("/intake");
  revalidatePath("/entry");
  revalidatePath("/archive");

  return {
    success: true,
    submittedAt: Date.now(),
    orderCount: uniqueIds.length,
  };
}
