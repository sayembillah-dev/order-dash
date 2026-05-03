"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/lib/models/Order";
import { getUtcDayBounds } from "@/lib/utc-day-bounds";
import { serializeOrder, type SerializedOrder } from "@/lib/serialize-order";

const imageUrlSchema = z.string().url();

const orderIdSchema = z.string().refine(
  (id) => /^[a-f\d]{24}$/i.test(id),
  "Invalid order id"
);

function parseImagesJson(json: string | undefined): string[] {
  if (!json?.trim()) return [];
  try {
    const arr = JSON.parse(json) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.filter((u) => typeof u === "string" && imageUrlSchema.safeParse(u).success);
  } catch {
    return [];
  }
}

const optionalTrimmedDetails = z.preprocess(
  (v) => (typeof v === "string" ? v : ""),
  z.string().transform((s) => s.trim())
);

const createOrderSchema = z.object({
  customerName: z.string().trim().min(1, "Customer name is required"),
  phone: z.string().trim().min(1, "Phone is required"),
  address: z.string().trim().min(1, "Address is required"),
  orderDetails: optionalTrimmedDetails,
  price: z.coerce.number().nonnegative("Price must be zero or positive"),
});

const lazyCreateOrderSchema = z.object({
  orderDetails: z.string().trim().min(1, "Order description is required"),
  note: z.string().trim().min(1, "Note is required"),
});

export type CreateOrderState = {
  error?: string;
  success?: boolean;
  /** New on each successful submit so client effects can run again */
  submittedAt?: number;
};

export async function createOrder(
  _prev: CreateOrderState | undefined,
  formData: FormData
): Promise<CreateOrderState> {
  await requireAuth();

  const imagesJson = String(formData.get("imagesJson") ?? "");
  const images = parseImagesJson(imagesJson);
  const lazyRaw = String(formData.get("lazyMode") ?? "").toLowerCase();
  const lazySubmit = lazyRaw === "1" || lazyRaw === "true" || lazyRaw === "on";

  if (lazySubmit) {
    const parsed = lazyCreateOrderSchema.safeParse({
      orderDetails: formData.get("orderDetails"),
      note: formData.get("note"),
    });

    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
      return { error: first ?? "Invalid form data" };
    }

    if (images.length === 0) {
      return {
        error: "Lazy mode requires at least one photo.",
      };
    }

    await connectDB();
    await Order.create({
      customerName: "",
      phone: "",
      address: "",
      orderDetails: parsed.data.orderDetails,
      note: parsed.data.note,
      price: 0,
      pathaoEntryDone: false,
      parcelCreationDone: false,
      images,
      lazySubmission: true,
    });

    revalidatePath("/parcel");
    revalidatePath("/entry");
    revalidatePath("/intake");

    return { success: true, submittedAt: Date.now() };
  }

  const parsed = createOrderSchema.safeParse({
    customerName: formData.get("customerName"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    orderDetails: formData.get("orderDetails"),
    price: formData.get("price"),
  });

  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return { error: first ?? "Invalid form data" };
  }

  await connectDB();
  await Order.create({
    ...parsed.data,
    note: "",
    pathaoEntryDone: false,
    parcelCreationDone: false,
    lazySubmission: false,
    images,
  });

  revalidatePath("/parcel");
  revalidatePath("/entry");
  revalidatePath("/intake");

  return { success: true, submittedAt: Date.now() };
}

/**
 * Update fields for orders still in the workflow (not ready-to-ship).
 * Lazy orders must be edited with lazy payload; full orders with full payload.
 */
export async function updateWorkflowOrder(
  _prev: CreateOrderState | undefined,
  formData: FormData,
): Promise<CreateOrderState> {
  await requireAuth();

  const orderId = orderIdSchema.parse(String(formData.get("orderId") ?? ""));
  const imagesJson = String(formData.get("imagesJson") ?? "");
  const images = parseImagesJson(imagesJson);
  const lazyRaw = String(formData.get("lazyMode") ?? "").toLowerCase();
  const lazySubmit =
    lazyRaw === "1" || lazyRaw === "true" || lazyRaw === "on";

  await connectDB();
  const existing = await Order.findById(orderId).exec();
  if (!existing) return { error: "Order not found" };
  if (existing.pathaoEntryDone && existing.parcelCreationDone) {
    return {
      error: "This order is ready to ship. Edit it from the archive.",
    };
  }

  if (lazySubmit) {
    if (!existing.lazySubmission) {
      return {
        error:
          "This order uses full customer fields. Edit it with the full form (lazy mode off).",
      };
    }
    const parsed = lazyCreateOrderSchema.safeParse({
      orderDetails: formData.get("orderDetails"),
      note: formData.get("note"),
    });

    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
      return { error: first ?? "Invalid form data" };
    }

    if (images.length === 0) {
      return {
        error: "Lazy mode requires at least one photo.",
      };
    }

    await Order.findByIdAndUpdate(orderId, {
      orderDetails: parsed.data.orderDetails,
      note: parsed.data.note,
      images,
    });
  } else {
    if (existing.lazySubmission) {
      return {
        error:
          "This order was created in lazy mode. Turn on lazy mode on Order intake to edit it there.",
      };
    }
    const parsed = createOrderSchema.safeParse({
      customerName: formData.get("customerName"),
      phone: formData.get("phone"),
      address: formData.get("address"),
      orderDetails: formData.get("orderDetails"),
      price: formData.get("price"),
    });

    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
      return { error: first ?? "Invalid form data" };
    }

    await Order.findByIdAndUpdate(orderId, {
      ...parsed.data,
      note: "",
      images,
    });
  }

  revalidatePath("/intake");
  revalidatePath("/parcel");
  revalidatePath("/entry");
  revalidatePath("/archive");

  return { success: true, submittedAt: Date.now() };
}

export async function submitIntakeOrder(
  _prev: CreateOrderState | undefined,
  formData: FormData,
): Promise<CreateOrderState> {
  const rawOrderId = String(formData.get("orderId") ?? "").trim();
  if (rawOrderId) {
    const idParsed = orderIdSchema.safeParse(rawOrderId);
    if (!idParsed.success) {
      return { error: "Invalid order id" };
    }
    return updateWorkflowOrder(_prev, formData);
  }
  return createOrder(_prev, formData);
}

export async function completeParcelCreation(formData: FormData): Promise<void> {
  await requireAuth();
  const id = orderIdSchema.parse(String(formData.get("orderId") ?? ""));
  await connectDB();
  await Order.findByIdAndUpdate(id, {
    parcelCreationDone: true,
    parcelCreationCompletedAt: new Date(),
  });
  revalidatePath("/intake");
  revalidatePath("/parcel");
  revalidatePath("/archive");
}

export async function completePathaoEntry(formData: FormData): Promise<void> {
  await requireAuth();
  const id = orderIdSchema.parse(String(formData.get("orderId") ?? ""));
  await connectDB();
  await Order.findByIdAndUpdate(id, {
    pathaoEntryDone: true,
    pathaoEntryCompletedAt: new Date(),
  });
  revalidatePath("/intake");
  revalidatePath("/entry");
  revalidatePath("/archive");
}

const updateArchiveSchema = z.object({
  orderId: orderIdSchema,
  customerName: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  address: z.string().trim().min(1),
  orderDetails: optionalTrimmedDetails,
  note: optionalTrimmedDetails,
  price: z.coerce.number().nonnegative(),
});

export type UpdateArchiveState = {
  error?: string;
  success?: boolean;
  updatedAt?: number;
};

export async function updateArchivedOrder(
  _prev: UpdateArchiveState | undefined,
  formData: FormData
): Promise<UpdateArchiveState> {
  await requireAuth();

  const parsed = updateArchiveSchema.safeParse({
    orderId: formData.get("orderId"),
    customerName: formData.get("customerName"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    orderDetails: formData.get("orderDetails"),
    note: formData.get("note"),
    price: formData.get("price"),
  });

  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return { error: first ?? "Invalid data" };
  }

  await connectDB();
  const order = await Order.findById(parsed.data.orderId).exec();
  if (!order) return { error: "Order not found" };
  if (!order.pathaoEntryDone || !order.parcelCreationDone) {
    return { error: "Order is not fully completed / archived." };
  }

  await Order.findByIdAndUpdate(parsed.data.orderId, {
    customerName: parsed.data.customerName,
    phone: parsed.data.phone,
    address: parsed.data.address,
    orderDetails: parsed.data.orderDetails,
    note: parsed.data.note,
    price: parsed.data.price,
  });

  revalidatePath("/archive");
  return { success: true, updatedAt: Date.now() };
}

export async function deleteOrder(formData: FormData): Promise<void> {
  await requireAuth();
  const id = orderIdSchema.parse(String(formData.get("orderId") ?? ""));
  await connectDB();
  await Order.findByIdAndDelete(id);
  revalidatePath("/intake");
  revalidatePath("/parcel");
  revalidatePath("/entry");
  revalidatePath("/archive");
}

export async function reopenParcelStep(formData: FormData): Promise<void> {
  await requireAuth();
  const id = orderIdSchema.parse(String(formData.get("orderId") ?? ""));
  await connectDB();
  await Order.findByIdAndUpdate(id, {
    $set: { parcelCreationDone: false },
    $unset: { parcelCreationCompletedAt: "" },
  });
  revalidatePath("/intake");
  revalidatePath("/parcel");
  revalidatePath("/archive");
}

export async function reopenPathaoStep(formData: FormData): Promise<void> {
  await requireAuth();
  const id = orderIdSchema.parse(String(formData.get("orderId") ?? ""));
  await connectDB();
  await Order.findByIdAndUpdate(id, {
    $set: { pathaoEntryDone: false },
    $unset: { pathaoEntryCompletedAt: "" },
  });
  revalidatePath("/intake");
  revalidatePath("/entry");
  revalidatePath("/archive");
}

export async function reopenBothSteps(formData: FormData): Promise<void> {
  await requireAuth();
  const id = orderIdSchema.parse(String(formData.get("orderId") ?? ""));
  await connectDB();
  await Order.findByIdAndUpdate(id, {
    $set: {
      pathaoEntryDone: false,
      parcelCreationDone: false,
    },
    $unset: {
      pathaoEntryCompletedAt: "",
      parcelCreationCompletedAt: "",
    },
  });
  revalidatePath("/intake");
  revalidatePath("/parcel");
  revalidatePath("/entry");
  revalidatePath("/archive");
}

/**
 * Parcel jobs marked “Order created” today (UTC): parcel step completed and
 * removed from the parcel queue. Requires `parcelCreationCompletedAt`.
 */
export async function getTodayParcelStepsCompleted(): Promise<
  SerializedOrder[]
> {
  await requireAuth();
  await connectDB();
  const { start, end } = getUtcDayBounds();
  const docs = await Order.find({
    parcelCreationDone: true,
    parcelCreationCompletedAt: { $gte: start, $lt: end },
  })
    .sort({ parcelCreationCompletedAt: -1 })
    .lean();
  return docs.map((o) => serializeOrder(o));
}

/** Pathao entries marked complete today (UTC); requires `pathaoEntryCompletedAt`. */
export async function getTodayPathaoEntriesCompleted(): Promise<
  SerializedOrder[]
> {
  await requireAuth();
  await connectDB();
  const { start, end } = getUtcDayBounds();
  const docs = await Order.find({
    pathaoEntryDone: true,
    pathaoEntryCompletedAt: { $gte: start, $lt: end },
  })
    .sort({ pathaoEntryCompletedAt: -1 })
    .lean();
  return docs.map((o) => serializeOrder(o));
}
